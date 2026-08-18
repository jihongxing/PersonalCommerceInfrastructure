param(
  [string]$EnvFile = $env:PILOT_ENV_FILE,
  [string]$StateFile = $env:PILOT_STATE_FILE
)

$ErrorActionPreference = "Continue"
$failures = [System.Collections.Generic.List[string]]::new()

function Add-Failure([string]$message) {
  $failures.Add($message)
}

function Require-Value([string]$name) {
  $value = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    Add-Failure "${name}: missing"
    return $null
  }
  if ($value -match 'replace|example\.com|example\.supabase\.co|your-project|your-') {
    Add-Failure "${name}: placeholder value is not deployable"
  }
  return $value.Trim()
}

if ([string]::IsNullOrWhiteSpace($EnvFile)) {
  Add-Failure "PILOT_ENV_FILE: required for activation preflight"
} elseif (-not (Test-Path -LiteralPath $EnvFile)) {
  Add-Failure "env-file: missing file"
}

if ($failures.Count -eq 0) {
  & powershell.exe -File scripts/operations/pilot-preflight.ps1 -EnvFile $EnvFile -VerifyEndpoints
  if ($LASTEXITCODE -ne 0) {
    Add-Failure "base pilot-preflight: blocked"
  }
}

$pilotId = Require-Value "PILOT_ID"
$configuredStateFile = [Environment]::GetEnvironmentVariable("PILOT_STATE_FILE")
$statePath = if ([string]::IsNullOrWhiteSpace($StateFile) -and -not [string]::IsNullOrWhiteSpace($configuredStateFile)) {
  $configuredStateFile
} elseif ([string]::IsNullOrWhiteSpace($StateFile)) {
  "pilot-state.json"
} else {
  $StateFile
}

if (-not (Test-Path -LiteralPath $statePath)) {
  Add-Failure "PILOT_STATE_FILE: state file is missing"
} else {
  try {
    $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
    if ($state.pilotId -ne $pilotId) {
      Add-Failure "PILOT_STATE_FILE: pilot ID does not match PILOT_ID"
    }
    if ($state.status -notin @("PROVISIONED", "PREFLIGHTED", "DEPLOYED", "PILOT_READY")) {
      Add-Failure "PILOT_STATE_FILE: status must be PROVISIONED, PREFLIGHTED, DEPLOYED or PILOT_READY"
    }
  } catch {
    Add-Failure "PILOT_STATE_FILE: invalid JSON state"
  }
}

$money = [Environment]::GetEnvironmentVariable("REAL_MONEY_ENABLED")
if ($money -ne "false") {
  Add-Failure "REAL_MONEY_ENABLED: must be exactly false"
}

foreach ($name in @(
  "PILOT_ID",
  "PILOT_AUDIT_DIR",
  "PILOT_FOUNDER_ACTIVATION_TOKEN",
  "WEB_PUBLIC_URL",
  "API_PUBLIC_URL",
  "SUPABASE_SITE_URL",
  "SUPABASE_ALLOWED_ORIGINS",
  "AUDIT_LOG_RETENTION_DAYS"
)) {
  Require-Value $name | Out-Null
}

$webUrl = [Environment]::GetEnvironmentVariable("WEB_PUBLIC_URL")
$apiUrl = [Environment]::GetEnvironmentVariable("API_PUBLIC_URL")
foreach ($entry in @(@("WEB_PUBLIC_URL", $webUrl), @("API_PUBLIC_URL", $apiUrl))) {
  if (-not [string]::IsNullOrWhiteSpace($entry[1])) {
    try {
      $parsed = [Uri]$entry[1]
      if ($parsed.Scheme -ne "https") { Add-Failure "${($entry[0])}: must use https" }
      if ($parsed.Host -in @("localhost", "127.0.0.1", "::1")) {
        Add-Failure "${($entry[0])}: loopback host is forbidden"
      }
      try {
        Resolve-DnsName -Name $parsed.Host -ErrorAction Stop | Out-Null
      } catch {
        Add-Failure "${($entry[0])}: DNS resolution failed"
      }
    } catch {
      Add-Failure "${($entry[0])}: invalid URL"
    }
  }
}

$auditDir = [Environment]::GetEnvironmentVariable("PILOT_AUDIT_DIR")
if (-not [string]::IsNullOrWhiteSpace($auditDir) -and -not (Test-Path -LiteralPath $auditDir)) {
  Add-Failure "PILOT_AUDIT_DIR: directory does not exist"
}

foreach ($path in @(
  "scripts/operations/backup-restore-external-pilot.ps1",
  "scripts/operations/backup-postgres.ps1",
  "scripts/database/migrate.ts"
)) {
  if (-not (Test-Path -LiteralPath $path)) {
    Add-Failure "required operational asset missing: $path"
  }
}

if ($failures.Count -eq 0) {
  Write-Output "PILOT ACTIVATION = READY"
} else {
  Write-Output "PILOT ACTIVATION = BLOCKED"
  foreach ($failure in $failures) {
    Write-Output "BLOCKER: $failure"
  }
}

Write-Output "CHECK: Founder activation remains separate from REAL_MONEY_ENABLED"
Write-Output "CHECK: no live Provider secret is accepted"
Write-Output "CHECK: no secret values emitted"

if ($failures.Count -gt 0) { exit 1 }
