param(
  [switch]$VerifyEndpoints,
  [string]$EnvFile
)

$ErrorActionPreference = "Continue"
$failures = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

if ($EnvFile) {
  if (-not (Test-Path -LiteralPath $EnvFile)) {
    $failures.Add("env-file: missing file")
  } else {
    Get-Content -LiteralPath $EnvFile | ForEach-Object {
      $line = $_.Trim()
      if ($line -and -not $line.StartsWith("#") -and $line -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        if (-not [Environment]::GetEnvironmentVariable($name)) {
          [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
      }
    }
  }
}

function Required([string]$name) {
  $value = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    $failures.Add("${name}: missing")
    return $null
  }
  if ($value -match 'replace|example\.com|example\.supabase\.co|your-project|your-') {
    $failures.Add("${name}: placeholder value is not deployable")
  }
  return $value.Trim()
}

function Url([string]$name, [bool]$HttpsOnly = $true) {
  $value = Required $name
  if ($null -eq $value) { return $null }
  try {
    $parsed = [Uri]$value
    if ($HttpsOnly -and $parsed.Scheme -ne "https") {
      $failures.Add("${name}: must use https")
    }
    if ($parsed.Host -in @("localhost", "127.0.0.1", "::1")) {
      $failures.Add("${name}: loopback host is forbidden")
    }
    return $parsed
  } catch {
    $failures.Add("${name}: invalid URL")
    return $null
  }
}

$runtime = Required "RUNTIME_ENV"
$app = Required "APP_ENV"
$money = Required "REAL_MONEY_ENABLED"
$database = Required "DATABASE_URL"
$supabase = Url "SUPABASE_URL" $false
$web = Url "WEB_PUBLIC_URL"
$api = Url "API_PUBLIC_URL"
$webOrigin = Url "WEB_REFERENCE_CLIENT_ORIGIN"
$apiBase = Url "NEXT_PUBLIC_API_BASE_URL"
Required "SUPABASE_ANON_KEY" | Out-Null
Required "CREATOR_ACTOR_MAPPINGS" | Out-Null
Required "OPERATIONS_ACCESS_TOKEN" | Out-Null
Required "OPERATIONS_OPERATOR_ID" | Out-Null
Required "AUDIT_LOG_RETENTION_DAYS" | Out-Null
Required "SUPABASE_SITE_URL" | Out-Null
Required "SUPABASE_ALLOWED_ORIGINS" | Out-Null

if ($env:CREATOR_ACTOR_MAPPINGS -eq '{}') {
  $failures.Add("CREATOR_ACTOR_MAPPINGS: at least one approved Pilot mapping is required")
}

if ($runtime -ne "controlled") { $failures.Add("RUNTIME_ENV: must be controlled") }
if ($app -ne "production") { $failures.Add("APP_ENV: must be production") }
if ($money -ne "false") { $failures.Add("REAL_MONEY_ENABLED: must be exactly false") }

if ($database -and ($database -match "localhost|127\.0\.0\.1|test|development|personal_commerce$")) {
  $failures.Add("DATABASE_URL: appears to reference Development/Test or the default database")
}

$liveNames = @(
  "LIVE_PROVIDER_ID",
  "LIVE_PROVIDER_URL",
  "LIVE_PROVIDER_MERCHANT_ACCOUNT",
  "LIVE_PROVIDER_API_CREDENTIAL",
  "LIVE_PROVIDER_WEBHOOK_SECRET",
  "LIVE_PROVIDER_ENVIRONMENT",
  "LIVE_PROVIDER_CURRENCY",
  "LIVE_PROVIDER_REGION"
)
foreach ($name in $liveNames) {
  if (-not [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
    $failures.Add("${name}: must be empty for the External Pilot package")
  }
}

if ($web -and $api -and $web.Host -eq $api.Host -and $web.Port -ne $api.Port) {
  $warnings.Add("public URL: one-host/two-port deployment; use an HTTPS reverse proxy before external exposure")
}

if ($VerifyEndpoints -and $api) {
  foreach ($path in @("/api/v1/health", "/api/v1/readiness")) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri "$($api.AbsoluteUri.TrimEnd('/'))$path" -TimeoutSec 8
      if ($response.StatusCode -ne 200) { $failures.Add("endpoint ${path}: returned $($response.StatusCode)") }
    } catch {
      $failures.Add("endpoint ${path}: unavailable")
    }
  }
}

if ($failures.Count -eq 0) {
  Write-Output "READY"
} else {
  Write-Output "BLOCKED"
}

foreach ($failure in $failures) { Write-Output "FAIL: $failure" }
foreach ($warning in $warnings) { Write-Output "WARN: $warning" }
Write-Output "CHECK: real money disabled"
Write-Output "CHECK: live provider secrets absent"
Write-Output "CHECK: no secret values emitted"

if ($failures.Count -gt 0) { exit 1 }
