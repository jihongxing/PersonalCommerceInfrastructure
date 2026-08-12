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
Invoke-Checked { node scripts/governance/check-user-facing-copy.mjs } "User-facing copy check"
Invoke-Checked { node scripts/design/check-token-calibration.mjs } "Design Token calibration"
Invoke-Checked { node scripts/design/check-web-token-adapter.mjs } "Web Token Adapter check"
Invoke-Checked { node scripts/governance/check-web-design-system.mjs } "Web Design System governance"

if (-not $SkipProjectTests) {
  Write-Host "== Project validation =="
  Invoke-Checked { pnpm format:check } "Format check"
  Invoke-Checked { pnpm lint } "Lint"
  Invoke-Checked { pnpm typecheck } "Typecheck"
  Invoke-Checked { pnpm test } "Tests"
  Invoke-Checked { pnpm build } "Build"
  Invoke-Checked { pnpm web:generate-api } "Web API client generation"
  Invoke-Checked { pnpm web:typecheck } "Web typecheck"
  Invoke-Checked { pnpm build:web } "Web build"
  Invoke-Checked { pnpm test:acceptance:browser } "Browser acceptance harness"
}

Write-Host "Preflight completed."
