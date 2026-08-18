param(
  [ValidateSet("docker", "podman")]
  [string]$ContainerCli = "docker",
  [Parameter(Mandatory = $true)]
  [string]$EnvFile,
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [ValidateSet("backup", "restore")]
  [string]$Action = "backup",
  [string]$RestoreDatabaseUrl
)

$ErrorActionPreference = "Stop"
$compose = "deploy/compose.external-pilot.yml"

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Pilot env file not found."
}

if ($Action -eq "backup") {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $BackupPath) | Out-Null
  & $ContainerCli "compose" "-f" $compose "--env-file" $EnvFile "exec" "-T" "postgres" `
    "pg_dump" "-U" "pilot_user" "-d" "personal_commerce_pilot" "-Fc" "-f" "/tmp/pilot.dump"
  if ($LASTEXITCODE -ne 0) { throw "Pilot database backup failed." }
  & $ContainerCli "compose" "-f" $compose "--env-file" $EnvFile "cp" `
    "postgres:/tmp/pilot.dump" $BackupPath
  if ($LASTEXITCODE -ne 0) { throw "Copying Pilot database backup failed." }
  Write-Output "Pilot backup created: $BackupPath"
  exit 0
}

if ([string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) {
  throw "RestoreDatabaseUrl is required for restore verification."
}

& $ContainerCli "run" "--rm" `
  "-v" "$(Resolve-Path $BackupPath):/backup/pilot.dump:ro" `
  "docker.io/library/postgres:17.6-bookworm" `
  "pg_restore" "--no-owner" "--clean" "--if-exists" `
  "--dbname=$RestoreDatabaseUrl" "/backup/pilot.dump"
if ($LASTEXITCODE -ne 0) { throw "Pilot database restore failed." }
Write-Output "Pilot restore verification completed."
