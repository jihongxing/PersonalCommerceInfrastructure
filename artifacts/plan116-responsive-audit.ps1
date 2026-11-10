param(
  [string]$Browse = 'E:/Users/jihx/.agents/skills/gstack/browse/dist/browse.exe',
  [string]$Origin = 'http://localhost:3002'
)
$ErrorActionPreference = 'Stop'
$routes = @(
  '/', '/dashboard', '/profile', '/profile?tab=public', '/profile/edit',
  '/capabilities', '/capabilities/new', '/capabilities/example/edit',
  '/services', '/services/new',
  '/services/eb387398-bfac-421d-a636-4261eb2dc51e',
  '/services/eb387398-bfac-421d-a636-4261eb2dc51e/edit',
  '/requests', '/onboarding', '/onboarding/welcome',
  '/r/KWKM47REPE9HVWEKCX', '/s/eb387398-bfac-421d-a636-4261eb2dc51e',
  '/o/8e92066e-5e7b-4d38-80d9-f2361fe01284',
  '/r/INVALID', '/s/missing', '/o/missing'
)
$logPath = Join-Path $PSScriptRoot 'plan116-responsive-audit.txt'
Set-Content -LiteralPath $logPath -Value ('Local authenticated browse audit: ' + (Get-Date -Format o))
foreach ($route in $routes) {
  $navigation = & $Browse goto ($Origin + $route) 2>&1
  Add-Content -LiteralPath $logPath -Value ($navigation -join "`n")
  $ready = & $Browse wait 'h1' 2>&1
  Add-Content -LiteralPath $logPath -Value ($ready -join "`n")
  foreach ($width in @(320, 375, 768, 1280, 1600)) {
    $commands = @(@('viewport', ($width.ToString() + 'x900')), @('eval', 'artifacts/plan116-measure-page.js'))
    $output = ($commands | ConvertTo-Json -Depth 5 -Compress) | & $Browse chain 2>&1
    Add-Content -LiteralPath $logPath -Value ($output -join "`n")
  }
  Write-Output ('Audited ' + $route)
}
