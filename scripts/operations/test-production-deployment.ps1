param(
  [ValidateSet("podman", "docker")]
  [string]$ContainerCli = "podman",
  [int]$ApiPort = 45200,
  [int]$WebPort = 45201,
  [string]$ApiImage = "personal-commerce-api:m9",
  [string]$WebImage = "personal-commerce-web:m9",
  [string]$RollbackApiImage = "personal-commerce-api:m9"
)

$ErrorActionPreference = "Stop"
$suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)
$network = "pci-m9-$suffix"
$databaseContainer = "pci-m9-db-$suffix"
$apiContainer = "pci-m9-api-$suffix"
$webContainer = "pci-m9-web-$suffix"
$backupPath = Join-Path (Get-Location) "output/backups/m9-$suffix.sql"
$environmentFile = Join-Path (Get-Location) "output/m9-$suffix.env"
$databaseUrl = "postgresql://personal_commerce:postgres@${databaseContainer}:5432/personal_commerce"

function Invoke-Container {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  & $ContainerCli @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$ContainerCli $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Wait-HttpReady {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        return
      }
    }
    catch {
    }
    Start-Sleep -Seconds 1
  }

  throw "Timed out waiting for $Url"
}

try {
  New-Item -ItemType Directory -Force -Path (Join-Path (Get-Location) "output") | Out-Null
  @(
    "APP_ENV=production"
    "RUNTIME_ENV=production"
    "REAL_MONEY_ENABLED=false"
    "API_HOST=0.0.0.0"
    "API_PORT=3000"
    "LOG_LEVEL=info"
    "WEB_REFERENCE_CLIENT_ORIGIN=http://127.0.0.1:$WebPort"
    "DATABASE_URL=$databaseUrl"
    "SUPABASE_URL=https://example.supabase.co"
    "SUPABASE_ANON_KEY=test-key"
    'CREATOR_ACTOR_MAPPINGS={"supabase:test-user":"creator-test"}'
    "OPERATIONS_ACCESS_TOKEN=production-drill-operations-token"
    "OPERATIONS_OPERATOR_ID=production-drill-operator"
  ) | Set-Content -LiteralPath $environmentFile -Encoding ascii

  Invoke-Container -Arguments @("network", "create", $network) | Out-Null
  Invoke-Container -Arguments @(
    "run",
    "-d",
    "--name",
    $databaseContainer,
    "--network",
    $network,
    "-e",
    "POSTGRES_DB=personal_commerce",
    "-e",
    "POSTGRES_USER=personal_commerce",
    "-e",
    "POSTGRES_PASSWORD=postgres",
    "docker.io/library/postgres:17"
  ) | Out-Null

  $databaseReady = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    & $ContainerCli exec $databaseContainer pg_isready -U personal_commerce -d personal_commerce *> $null
    if ($LASTEXITCODE -eq 0) {
      $databaseReady = $true
      break
    }
    Start-Sleep -Seconds 1
  }
  if (-not $databaseReady) {
    throw "PostgreSQL did not become ready."
  }

  Invoke-Container -Arguments @(
    "run",
    "--rm",
    "--network",
    $network,
    "-e",
    "DATABASE_URL=$databaseUrl",
    $ApiImage,
    "node",
    "dist/scripts/database/migrate.js"
  )

  Invoke-Container -Arguments @(
    "run",
    "-d",
    "--name",
    $apiContainer,
    "--network",
    $network,
    "-p",
    "${ApiPort}:3000",
    "--env-file",
    $environmentFile,
    $ApiImage
  ) | Out-Null
  Wait-HttpReady "http://127.0.0.1:$ApiPort/api/v1/readiness"

  Invoke-Container -Arguments @(
    "run",
    "-d",
    "--name",
    $webContainer,
    "--network",
    $network,
    "-p",
    "${WebPort}:3001",
    $WebImage
  ) | Out-Null
  Wait-HttpReady "http://127.0.0.1:$WebPort"

  $env:SMOKE_API_BASE_URL = "http://127.0.0.1:$ApiPort"
  $env:SMOKE_WEB_BASE_URL = "http://127.0.0.1:$WebPort"
  pnpm smoke:deployment
  if ($LASTEXITCODE -ne 0) {
    throw "Deployment smoke failed with exit code $LASTEXITCODE"
  }

  & "$PSScriptRoot/backup-postgres.ps1" `
    -ContainerName $databaseContainer `
    -OutputPath $backupPath `
    -ContainerCli $ContainerCli
  & "$PSScriptRoot/restore-postgres.ps1" `
    -ContainerName $databaseContainer `
    -InputPath $backupPath `
    -DatabaseName personal_commerce_restore `
    -ContainerCli $ContainerCli

  $migrationCount = (
    & $ContainerCli exec $databaseContainer psql `
      --username personal_commerce `
      --dbname personal_commerce_restore `
      --tuples-only `
      --no-align `
      --command "select count(*) from drizzle.__drizzle_migrations;"
  ).Trim()
  if ($LASTEXITCODE -ne 0 -or $migrationCount -eq "0") {
    throw "Restored database migration verification failed."
  }

  Invoke-Container -Arguments @("stop", "--time", "10", $apiContainer) | Out-Null
  $apiLogs = & $ContainerCli logs $apiContainer 2>&1
  if (($apiLogs -join [Environment]::NewLine) -notmatch "api_shutdown_completed") {
    throw "Graceful shutdown evidence is missing."
  }

  Invoke-Container -Arguments @("rm", $apiContainer) | Out-Null
  Invoke-Container -Arguments @(
    "run",
    "-d",
    "--name",
    $apiContainer,
    "--network",
    $network,
    "-p",
    "${ApiPort}:3000",
    "--env-file",
    $environmentFile,
    $RollbackApiImage
  ) | Out-Null
  Wait-HttpReady "http://127.0.0.1:$ApiPort/api/v1/readiness"
  node scripts/operations/deployment-smoke.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "Rollback smoke failed with exit code $LASTEXITCODE"
  }

  Write-Output "Production deployment drill passed: migrations=$migrationCount backup=$backupPath"
}
finally {
  Remove-Item Env:SMOKE_API_BASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:SMOKE_WEB_BASE_URL -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $environmentFile -Force -ErrorAction SilentlyContinue
  foreach ($container in @($webContainer, $apiContainer, $databaseContainer)) {
    & $ContainerCli rm -f $container *> $null
  }
  & $ContainerCli network rm $network *> $null
}
