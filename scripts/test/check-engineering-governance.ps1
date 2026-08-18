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
  "docs\09_Engineering_Governance\39A_VS02D_Controlled_Real_Money_Activation_Readiness.md",
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
  "39A_VS02D_Controlled_Real_Money_Activation_Readiness.md",
  "21_Prototype_Execution.md"
)) {
  if ($index -notmatch [regex]::Escape($relativePath)) {
    throw "docs/README.md does not index: $relativePath"
  }
}

$activationReadiness = Get-Content -LiteralPath (Join-Path $repo "docs\09_Engineering_Governance\39A_VS02D_Controlled_Real_Money_Activation_Readiness.md") -Raw
foreach ($requiredConclusion in @(
  "VS-02D Engineering Readiness = READY",
  "Real Money Activation = MANUAL FOUNDER GO REQUIRED",
  "Provider Qualification = External Parallel Track",
  "No Real Money Evidence"
)) {
  if ($activationReadiness -notmatch [regex]::Escape($requiredConclusion)) {
    throw "VS-02D readiness governance is missing conclusion: $requiredConclusion"
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

$openApiManifest = Get-Content -LiteralPath (Join-Path $repo "contracts\api\v1\openapi-compatibility.json") -Raw | ConvertFrom-Json
$requiredVs01Operations = [ordered]@{
  "GET /api/v1/creator/confirmed-requests" = "listCreatorConfirmedRequests"
  "GET /api/v1/creator/identity" = "getCreatorIdentity"
  "GET /api/v1/creator/offerings" = "listCreatorServiceOfferings"
  "GET /api/v1/creator/requests" = "listCreatorSubmittedRequests"
  "GET /api/v1/public/offerings/{offeringId}" = "getPublicServiceOffering"
  "GET /api/v1/public/requests/{resultAccessToken}" = "getCustomerRequestResult"
  "PATCH /api/v1/creator/identity" = "updateCreatorIdentity"
  "PATCH /api/v1/creator/offerings/{offeringId}" = "updateCreatorServiceOffering"
  "POST /api/v1/creator/identity" = "createCreatorIdentity"
  "POST /api/v1/creator/identity/capabilities" = "addCreatorCapability"
  "POST /api/v1/creator/offerings" = "createCreatorServiceOffering"
  "POST /api/v1/creator/offerings/{offeringId}/distribution" = "recordCreatorExternalDistribution"
  "POST /api/v1/creator/offerings/{offeringId}/publish" = "publishCreatorServiceOffering"
  "POST /api/v1/creator/offerings/{offeringId}/unpublish" = "unpublishCreatorServiceOffering"
  "POST /api/v1/creator/requests/{actionId}/confirm" = "confirmCreatorRequest"
  "POST /api/v1/creator/requests/{actionId}/decline" = "declineCreatorRequest"
  "POST /api/v1/public/offerings/{offeringId}/requests" = "submitCustomerRequest"
}

foreach ($operation in $requiredVs01Operations.GetEnumerator()) {
  $manifestOperation = $openApiManifest.PSObject.Properties[$operation.Key]
  if ($null -eq $manifestOperation) {
    throw "VS-01 regression route is missing from OpenAPI compatibility manifest: $($operation.Key)"
  }
  if ($manifestOperation.Value -ne $operation.Value) {
    throw "VS-01 regression operation changed: $($operation.Key) expected $($operation.Value), actual $($manifestOperation.Value)"
  }
}

$canonicalEvents = Get-Content -LiteralPath (Join-Path $repo "modules\product-facts\canonical-events.ts") -Raw
foreach ($eventName in @(
  "creator_registered",
  "creator_qualified",
  "creator_activated",
  "creator_published",
  "creator_distributed",
  "storefront_viewed",
  "commerce_action_submitted",
  "commerce_confirmed",
  "commerce_declined"
)) {
  if ($canonicalEvents -notmatch "'$([regex]::Escape($eventName))'") {
    throw "VS-01 canonical event is missing: $eventName"
  }
}

$vs01PermissionRegression = Get-Content -LiteralPath (Join-Path $repo "tests\integration\creator-identity-api.test.ts") -Raw
foreach ($permissionEvidence in @(
  "rejects missing authentication",
  "protected terminal outcomes",
  "expect(unauthorized.statusCode).toBe(403)",
  "expect(repeated.statusCode).toBe(409)"
)) {
  if ($vs01PermissionRegression -notmatch [regex]::Escape($permissionEvidence)) {
    throw "VS-01 permission regression evidence is missing: $permissionEvidence"
  }
}

Write-Host "Engineering governance check passed."
