param(
  [ValidateSet("status", "activate", "close")]
  [string]$Action = "status",
  [string]$StateFile = $env:PILOT_STATE_FILE,
  [string]$AuditFile = $env:PILOT_AUDIT_FILE,
  [string]$FounderToken = $env:PILOT_FOUNDER_ACTIVATION_TOKEN,
  [string]$Confirm
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($StateFile)) { throw "PILOT_STATE_FILE is required." }
if ([string]::IsNullOrWhiteSpace($AuditFile)) { throw "PILOT_AUDIT_FILE is required." }
if (-not (Test-Path -LiteralPath $StateFile)) { throw "Pilot state file was not found." }

$state = Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json
$pilotId = [Environment]::GetEnvironmentVariable("PILOT_ID")
if ([string]::IsNullOrWhiteSpace($pilotId)) { throw "PILOT_ID is required." }
if ($state.pilotId -ne $pilotId) { throw "Pilot state does not match PILOT_ID." }

function Write-Audit([string]$event, [string]$from, [string]$to) {
  $record = [ordered]@{
    event = $event
    pilotId = $pilotId
    from = $from
    to = $to
    actor = "founder"
    occurredAt = [DateTime]::UtcNow.ToString("o")
    realMoneyEnabled = ([Environment]::GetEnvironmentVariable("REAL_MONEY_ENABLED") -eq "true")
  }
  $directory = Split-Path -Parent $AuditFile
  if (-not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  ($record | ConvertTo-Json -Compress) | Add-Content -LiteralPath $AuditFile
}

switch ($Action) {
  "status" {
    Write-Output "PILOT_ID=$pilotId"
    Write-Output "PILOT_STATUS=$($state.status)"
    exit 0
  }
  "activate" {
    if ($state.status -ne "PILOT_READY") {
      throw "Activation requires PILOT_READY; current state is $($state.status)."
    }
    if ([string]::IsNullOrWhiteSpace($FounderToken)) {
      throw "PILOT_FOUNDER_ACTIVATION_TOKEN is required."
    }
    if ($Confirm -ne "FOUNDER_ACTIVATE_PILOT") {
      throw "Explicit confirmation is required: FOUNDER_ACTIVATE_PILOT."
    }
    if ([Environment]::GetEnvironmentVariable("REAL_MONEY_ENABLED") -ne "false") {
      throw "REAL_MONEY_ENABLED must remain exactly false."
    }
    if ([Environment]::GetEnvironmentVariable("PILOT_ACTIVATION_ACTOR") -ne "founder") {
      throw "PILOT_ACTIVATION_ACTOR must be founder."
    }
    $previous = $state.status
    $state.status = "FOUNDER_ACTIVATED"
    $state.activatedAt = [DateTime]::UtcNow.ToString("o")
    $state.activationActor = "founder"
    $state | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $StateFile
    Write-Audit "pilot_founder_activated" $previous $state.status
    Write-Output "PILOT STATUS = FOUNDER_ACTIVATED"
    exit 0
  }
  "close" {
    if ($state.status -notin @("PILOT_RUNNING", "PILOT_CLOSING")) {
      throw "Close requires PILOT_RUNNING or PILOT_CLOSING; current state is $($state.status)."
    }
    $previous = $state.status
    $state.status = "PILOT_CLOSED"
    $state.closedAt = [DateTime]::UtcNow.ToString("o")
    $state | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $StateFile
    Write-Audit "pilot_closed" $previous $state.status
    Write-Output "PILOT STATUS = PILOT_CLOSED"
    exit 0
  }
}
