$ErrorActionPreference = "Stop"

$repo = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$requiredFiles = @(
  "AGENTS.md",
  "ROADMAP.md",
  "docs\README.md",
  "docs\09_Engineering_Governance\22_Engineering_Governance.md",
  "docs\09_Engineering_Governance\23_Technology_Architecture_Decision.md",
  "docs\09_Engineering_Governance\24_Technology_Architecture_Implementation_Plan.md",
  "docs\09_Engineering_Governance\architecture-and-directory.md",
  "docs\09_Engineering_Governance\code-style-and-naming.md",
  "docs\09_Engineering_Governance\configuration-and-secrets.md",
  "docs\09_Engineering_Governance\external-dependencies.md",
  "docs\08_Execution\21_Prototype_Execution.md",
  "docs\07_Product_Architecture\20_MVP_PRD_VS01.md"
)

foreach ($relativePath in $requiredFiles) {
  $path = Join-Path $repo $relativePath
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing engineering governance file: $relativePath"
  }
}

$index = Get-Content -LiteralPath (Join-Path $repo "docs\README.md") -Raw
foreach ($relativePath in @(
  "22_Engineering_Governance.md",
  "23_Technology_Architecture_Decision.md",
  "24_Technology_Architecture_Implementation_Plan.md",
  "architecture-and-directory.md",
  "code-style-and-naming.md",
  "configuration-and-secrets.md",
  "external-dependencies.md",
  "21_Prototype_Execution.md"
)) {
  if ($index -notmatch [regex]::Escape($relativePath)) {
    throw "docs/README.md does not index: $relativePath"
  }
}

$governance = Get-Content -LiteralPath (Join-Path $repo "docs\09_Engineering_Governance\22_Engineering_Governance.md") -Raw
foreach ($section in @(
  "## 3. 事实源映射",
  "## 4. 仓库与架构治理",
  "## 5. 产品 → 领域 → 代码 → 测试 → 验收追溯",
  "## 7. 状态机治理",
  "## 8. 规范事件治理",
  "## 9. 测试治理",
  "## 10. 变更与偏差治理",
  "## 11. 配置、安全与运行治理"
)) {
  if ($governance -notmatch [regex]::Escape($section)) {
    throw "Engineering governance document is missing section: $section"
  }
}

$prd = Get-Content -LiteralPath (Join-Path $repo "docs\07_Product_Architecture\20_MVP_PRD_VS01.md") -Raw
foreach ($requirement in 1..53) {
  $fr = "FR-{0:D3}" -f $requirement
  if ($prd -notmatch [regex]::Escape($fr)) {
    throw "PRD is missing: $fr"
  }
}

$execution = Get-Content -LiteralPath (Join-Path $repo "docs\08_Execution\21_Prototype_Execution.md") -Raw
foreach ($requirement in 1..53) {
  $fr = "FR-{0:D3}" -f $requirement
  if ($execution -notmatch [regex]::Escape($fr)) {
    throw "Execution ledger is missing: $fr"
  }
}

foreach ($test in 1..13) {
  $at = "AT-{0:D3}" -f $test
  if ($execution -notmatch [regex]::Escape($at)) {
    throw "Execution ledger is missing: $at"
  }
}

$acceptancePath = Join-Path $repo "tests\acceptance\vs01.acceptance.test.ts"
if (-not (Test-Path -LiteralPath $acceptancePath)) {
  throw "Missing VS-01 acceptance test entry: tests\acceptance\vs01.acceptance.test.ts"
}

$acceptance = Get-Content -LiteralPath $acceptancePath -Raw
foreach ($test in 1..13) {
  $at = "AT-{0:D3}" -f $test
  if ($acceptance -notmatch [regex]::Escape($at)) {
    throw "Acceptance test entry is missing: $at"
  }
}

foreach ($forbidden in @(
  "Payment",
  "Settlement",
  "Refund",
  "Marketplace",
  "Customer CRM"
)) {
  if ($prd -notmatch [regex]::Escape($forbidden)) {
    throw "PRD boundary does not mention forbidden capability: $forbidden"
  }
}

$productCodeAreas = @("apps", "applications", "contracts", "modules", "adapters", "database", "packages")
foreach ($area in $productCodeAreas) {
  $path = Join-Path $repo $area
  if (Test-Path -LiteralPath $path) {
    $directReads = Get-ChildItem -LiteralPath $path -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.py,*.cs,*.go,*.rs -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notmatch "[\\/](node_modules|dist|coverage|\.next)[\\/]" } |
      Where-Object { $_.FullName -notmatch "[\\/]configuration[\\/]bootstrap\.(ts|js|py|cs)$" } |
      Select-String -Pattern "process\.env|import\.meta\.env|os\.environ|Environment\.GetEnvironmentVariable" -ErrorAction SilentlyContinue
    if ($directReads.Count -gt 0) {
      $locations = $directReads | ForEach-Object { "$($_.Path):$($_.LineNumber)" }
      throw "Direct environment reads must stay in configuration bootstrap: $($locations -join ', ')"
    }
  }
}

$requiredImplementationPaths = @(
  "apps\prototype\src\main.ts",
  "apps\prototype\src\configuration\bootstrap.ts",
  "apps\api\src\main.ts",
  "apps\api\src\create-api-server.ts",
  "apps\web\AGENTS.md",
  "apps\web\package.json",
  "apps\web\src\configuration\bootstrap.ts",
  "apps\web\src\lib\api\client.ts",
  "apps\web\src\lib\api\generated.d.ts",
  "apps\web\src\app\creator\page.tsx",
  "apps\web\src\app\public\page.tsx",
  "apps\web\src\app\customer\page.tsx",
  "playwright.config.ts",
  "tests\acceptance\browser\drivers\reference-client-driver.ts",
  "tests\acceptance\browser\fixtures\actors.ts",
  "tests\acceptance\browser\fixtures\evidence.ts",
  "tests\acceptance\browser\foundation.spec.ts",
  "tests\acceptance\browser\vs01.spec.ts",
  "applications\README.md",
  "applications\AGENTS.md",
  "contracts\README.md",
  "contracts\AGENTS.md",
  "contracts\api\v1\system-contracts.ts",
  "contracts\api\v1\auth-contracts.ts",
  "modules\creator-commerce-identity",
  "modules\service-offering",
  "modules\distribution",
  "modules\customer-request",
  "modules\commerce-decision",
  "modules\product-facts",
  "adapters\observability",
  "adapters\auth\README.md",
  "adapters\auth\supabase\supabase-auth-context-provider.ts",
  "adapters\auth\testing\in-memory-auth-context-provider.ts",
  "adapters\auth\transport\bearer-token.ts",
  "adapters\transport\http",
  "adapters\persistence\postgres\postgres-database.ts",
  "adapters\persistence\postgres\postgres-product-event-store.ts",
  "adapters\persistence\postgres\postgres-unit-of-work.ts",
  "database\AGENTS.md",
  "database\schema\product-events.ts",
  "database\migrations\meta\_journal.json",
  "tests\persistence",
  "tests\application",
  "tests\contracts",
  "tests\integration",
  "tests\acceptance"
)

foreach ($relativePath in $requiredImplementationPaths) {
  if (-not (Test-Path -LiteralPath (Join-Path $repo $relativePath))) {
    throw "Missing M1 implementation boundary: $relativePath"
  }
}

$runtimeCode = Get-ChildItem -LiteralPath (Join-Path $repo "apps"), (Join-Path $repo "applications"), (Join-Path $repo "contracts"), (Join-Path $repo "modules"), (Join-Path $repo "adapters"), (Join-Path $repo "database") -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notmatch "\.test\." } |
  Where-Object { $_.FullName -notmatch "[\\/](node_modules|dist|coverage|\.next)[\\/]" }

$deferredMatches = $runtimeCode |
  Select-String -Pattern "\b(payment|settlement|refund|marketplace|customer-crm)\b" -CaseSensitive:$false -ErrorAction SilentlyContinue

if ($deferredMatches.Count -gt 0) {
  $locations = $deferredMatches | ForEach-Object { "$($_.Path):$($_.LineNumber)" }
  throw "Deferred capability names must not enter runtime code: $($locations -join ', ')"
}

Write-Host "Engineering governance check passed."
