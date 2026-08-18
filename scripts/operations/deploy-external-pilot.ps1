param(
  [ValidateSet("docker", "podman")]
  [string]$ContainerCli = "docker",
  [Parameter(Mandatory = $true)]
  [string]$EnvFile,
  [switch]$Down
)

$ErrorActionPreference = "Stop"
$compose = "deploy/compose.external-pilot.yml"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Pilot env file not found. Copy deploy/external-pilot.env.example to a protected location."
}

& powershell.exe -File scripts/operations/pilot-preflight.ps1 -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) { throw "pilot-preflight blocked deployment." }

$composeArgs = @("-f", $compose, "--env-file", $EnvFile)
if ($Down) {
  & $ContainerCli "compose" @composeArgs "down"
  if ($LASTEXITCODE -ne 0) { throw "Container cleanup failed." }
  exit 0
}

& $ContainerCli "compose" @composeArgs "build"
if ($LASTEXITCODE -ne 0) { throw "API/Web image build failed." }
& $ContainerCli "compose" @composeArgs "up" "-d" "postgres"
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL start failed." }
& $ContainerCli "compose" @composeArgs "run" "--rm" "migrate"
if ($LASTEXITCODE -ne 0) { throw "Migration failed." }
& $ContainerCli "compose" @composeArgs "up" "-d" "api" "web"
if ($LASTEXITCODE -ne 0) { throw "API/Web start failed." }

Write-Output "Deployment started. Run health/readiness and public acceptance against the configured HTTPS URLs."
