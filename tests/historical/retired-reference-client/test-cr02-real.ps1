param(
  [string]$ContainerCli = "podman",
  [string]$PostgresImage = "docker.io/library/postgres:17"
)

$ErrorActionPreference = "Stop"
$containerName = "pci-cr02-postgres"
$databasePort = 55433
$databaseUrl = "postgresql://personal_commerce:postgres@127.0.0.1:$databasePort/personal_commerce"
$requiredEnvironmentVariables = @(
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_TEST_EMAIL",
  "SUPABASE_TEST_PASSWORD"
)

foreach ($name in $requiredEnvironmentVariables) {
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
    throw "CR-02 real browser verification requires $name in the current PowerShell process."
  }
}

if ($null -eq (Get-Command $ContainerCli -ErrorAction SilentlyContinue)) {
  throw "Container runtime '$ContainerCli' is not available."
}

try {
  & $ContainerCli rm -f $containerName *> $null
  & $ContainerCli run `
    --detach `
    --name $containerName `
    --publish "${databasePort}:5432" `
    --env POSTGRES_DB=personal_commerce `
    --env POSTGRES_USER=personal_commerce `
    --env POSTGRES_PASSWORD=postgres `
    $PostgresImage *> $null

  $databaseReady = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    & $ContainerCli exec $containerName pg_isready `
      --username personal_commerce `
      --dbname personal_commerce *> $null
    if ($LASTEXITCODE -eq 0) {
      $databaseReady = $true
      break
    }
    Start-Sleep -Milliseconds 500
  }

  if (-not $databaseReady) {
    throw "Temporary PostgreSQL did not become ready."
  }

  $env:DATABASE_URL = $databaseUrl
  pnpm db:migrate
  if ($LASTEXITCODE -ne 0) {
    throw "CR-02 database migration failed."
  }

  $identityJson = @'
const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/u, '')}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    apikey: process.env.SUPABASE_ANON_KEY,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    email: process.env.SUPABASE_TEST_EMAIL,
    password: process.env.SUPABASE_TEST_PASSWORD,
  }),
});
const body = await response.json();
if (!response.ok || typeof body.user?.id !== 'string') {
  throw new Error('Controlled Supabase user could not authenticate.');
}
process.stdout.write(body.user.id);
'@ | node --input-type=module -

  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($identityJson)) {
    throw "Controlled Supabase subject could not be resolved."
  }

  $creatorId = "creator-cr02-real"
  $mapping = @{"supabase:$identityJson" = $creatorId}
  $env:CREATOR_ACTOR_MAPPINGS = $mapping | ConvertTo-Json -Compress
  $env:OPERATIONS_ACCESS_TOKEN = "cr02-controlled-operations-token"
  $env:OPERATIONS_OPERATOR_ID = "cr02-controlled-operator"
  $env:RUN_REAL_CR02_BROWSER_TESTS = "1"

  pnpm exec playwright test tests/acceptance/browser/cr02-authenticated-creator-desk.spec.ts
  if ($LASTEXITCODE -ne 0) {
    throw "CR-02 real browser verification failed."
  }
}
finally {
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:CREATOR_ACTOR_MAPPINGS -ErrorAction SilentlyContinue
  Remove-Item Env:OPERATIONS_ACCESS_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:OPERATIONS_OPERATOR_ID -ErrorAction SilentlyContinue
  Remove-Item Env:RUN_REAL_CR02_BROWSER_TESTS -ErrorAction SilentlyContinue
  & $ContainerCli rm -f $containerName *> $null
}
