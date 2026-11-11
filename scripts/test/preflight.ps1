param(
  [switch]$SkipProjectTests
)

$ErrorActionPreference = "Stop"

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

Write-Host "== Engineering governance =="
& "$PSScriptRoot\check-engineering-governance.ps1"
Invoke-Checked { node scripts/test/check-import-boundaries.mjs } "Import boundary check"
Invoke-Checked { node scripts/design/check-token-calibration.mjs } "Design Token calibration"

if (-not $SkipProjectTests) {
  Write-Host "== Project validation =="
  Invoke-Checked { pnpm format:check } "Format check"
  Invoke-Checked { pnpm lint } "Lint"
  Invoke-Checked { pnpm typecheck } "Typecheck"
  Invoke-Checked { pnpm test } "Tests"
  Invoke-Checked { pnpm build } "Build"
  Invoke-Checked { pnpm check:openapi } "OpenAPI compatibility"
  Invoke-Checked { pnpm web:typecheck } "Web typecheck"
  Invoke-Checked { pnpm build:web } "Web build"
  Invoke-Checked { pnpm test:acceptance:browser } "Creator Web browser acceptance (requires controlled API fixture)"
}

Write-Host "Preflight completed."
