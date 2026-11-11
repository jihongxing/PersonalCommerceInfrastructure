param(
  [ValidateSet("podman", "docker")]
  [string]$ContainerCli = "podman",
  [int]$DatabasePort = 45230
)

$ErrorActionPreference = "Stop"

$containerName = "pci-vs02e-pg-browser-$([Guid]::NewGuid().ToString('N').Substring(0, 8))"
$databaseUrl = "postgresql://personal_commerce:postgres@127.0.0.1:${DatabasePort}/personal_commerce"

function Invoke-Checked {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Command,
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

try {
  Invoke-Checked {
    & $ContainerCli run -d --name $containerName -p "${DatabasePort}:5432" `
      -e POSTGRES_DB=personal_commerce `
      -e POSTGRES_USER=personal_commerce `
      -e POSTGRES_PASSWORD=postgres `
      docker.io/library/postgres:17
  } "PostgreSQL container startup"

  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    & $ContainerCli exec $containerName pg_isready -U personal_commerce -d personal_commerce *> $null
    if ($LASTEXITCODE -eq 0) {
      $ready = $true
      break
    }
    Start-Sleep -Seconds 1
  }
  if (-not $ready) {
    throw "PostgreSQL did not become ready."
  }

  $env:DATABASE_URL = $databaseUrl
  $env:SUPABASE_URL = "https://test-project.supabase.co"
  $env:SUPABASE_ANON_KEY = "test-anon-key"
  $env:CREATOR_ACTOR_MAPPINGS = '{"supabase:test-user":"creator-test-1"}'
  $env:OPERATIONS_ACCESS_TOKEN = "test-operations-token"
  $env:OPERATIONS_OPERATOR_ID = "postgres-simulation-operator"
  $env:RUN_VS02E_POSTGRES_BROWSER_TESTS = "1"

  Invoke-Checked { pnpm db:migrate } "PostgreSQL migrations"
  Invoke-Checked {
    pnpm exec playwright test tests/acceptance/browser/zz-vs02e-local-commercial-simulation.spec.ts `
      --project=system-edge
  } "VS-02E PostgreSQL browser acceptance"

  Write-Output "VS-02E PostgreSQL browser acceptance passed."
}
finally {
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:SUPABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:SUPABASE_ANON_KEY -ErrorAction SilentlyContinue
  Remove-Item Env:CREATOR_ACTOR_MAPPINGS -ErrorAction SilentlyContinue
  Remove-Item Env:OPERATIONS_ACCESS_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:OPERATIONS_OPERATOR_ID -ErrorAction SilentlyContinue
  Remove-Item Env:RUN_VS02E_POSTGRES_BROWSER_TESTS -ErrorAction SilentlyContinue
  & $ContainerCli rm -f $containerName *> $null
}
