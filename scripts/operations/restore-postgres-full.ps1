param(
  [Parameter(Mandatory = $true)]
  [string]$ContainerName,
  [Parameter(Mandatory = $true)]
  [string]$InputDirectory,
  [Parameter(Mandatory = $true)]
  [string]$DatabaseName,
  [Parameter(Mandatory = $true)]
  [string]$DatabaseAdminUser,
  [ValidateSet("podman", "docker")]
  [string]$ContainerCli = "podman"
)

$ErrorActionPreference = "Stop"

function Invoke-Container {
  param([string[]]$Arguments)

  $output = & $ContainerCli @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    $message = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    throw "Container command failed: $message"
  }
  return $output
}

function Quote-PostgresIdentifier {
  param([Parameter(Mandatory = $true)][string]$Value)
  return '"' + $Value.Replace('"', '""') + '"'
}

if ($DatabaseName -eq "personal_commerce") {
  throw "Restore must target a separate verification database."
}

$resolvedInputDirectory = (Resolve-Path -LiteralPath $InputDirectory).Path
$manifestPath = Join-Path $resolvedInputDirectory "manifest.json"
$dumpPath = Join-Path $resolvedInputDirectory "database.dump"
$globalsPath = Join-Path $resolvedInputDirectory "globals.sql"
foreach ($path in @($manifestPath, $dumpPath, $globalsPath)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Recovery artifact is missing: $path" }
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
foreach ($artifact in @($manifest.artifacts.databaseDump, $manifest.artifacts.globals)) {
  $path = Join-Path $resolvedInputDirectory $artifact.file
  $actual = Get-FileHash -LiteralPath $path -Algorithm SHA256
  if ($actual.Hash.ToLowerInvariant() -ne $artifact.sha256.ToLowerInvariant()) {
    throw "Recovery artifact integrity check failed: $path"
  }
}

$token = [Guid]::NewGuid().ToString("N")
$containerDumpPath = "/tmp/pci-eng-029-$token.dump"
$containerGlobalsPath = "/tmp/pci-eng-029-$token-globals.sql"
$databaseIdentifier = Quote-PostgresIdentifier -Value $DatabaseName
$databaseOwner = [string]$manifest.databaseOwner
if ([string]::IsNullOrWhiteSpace($databaseOwner)) { throw "Backup manifest has no database owner." }
$created = $false

try {
  Invoke-Container -Arguments @("cp", $globalsPath, "${ContainerName}:$containerGlobalsPath") | Out-Null
  Invoke-Container -Arguments @("cp", $dumpPath, "${ContainerName}:$containerDumpPath") | Out-Null

  Invoke-Container -Arguments @(
    "exec", $ContainerName, "psql", "--no-password", "--set", "ON_ERROR_STOP=1",
    "--username", $DatabaseAdminUser, "--dbname", "postgres", "--file", $containerGlobalsPath
  ) | Out-Null

  Invoke-Container -Arguments @(
    "exec", $ContainerName, "createdb", "--no-password", "--username", $DatabaseAdminUser,
    "--owner", $databaseOwner, $DatabaseName
  ) | Out-Null
  $created = $true

  Invoke-Container -Arguments @(
    "exec", $ContainerName, "pg_restore", "--no-password", "--exit-on-error",
    "--username", $DatabaseAdminUser, "--dbname", $DatabaseName, $containerDumpPath
  ) | Out-Null

  $grantStatements = [System.Collections.Generic.List[string]]::new()
  $grantStatements.Add("REVOKE ALL ON DATABASE $databaseIdentifier FROM PUBLIC;")
  foreach ($entry in @($manifest.databasePrivileges)) {
    if ([string]::IsNullOrWhiteSpace([string]$entry)) { continue }
    $parts = ([string]$entry).Split('|')
    if ($parts.Count -ne 3) { throw "Invalid database privilege entry in manifest: $entry" }
    $grantee = if ($parts[0] -eq 'PUBLIC') { 'PUBLIC' } else { Quote-PostgresIdentifier -Value $parts[0] }
    $grant = "GRANT $($parts[1]) ON DATABASE $databaseIdentifier TO $grantee"
    if ($parts[2] -eq 't') { $grant += ' WITH GRANT OPTION' }
    $grantStatements.Add("$grant;")
  }
  Invoke-Container -Arguments @(
    "exec", $ContainerName, "psql", "--no-password", "--set", "ON_ERROR_STOP=1",
    "--username", $DatabaseAdminUser, "--dbname", "postgres", "--command", ($grantStatements -join "`n")
  ) | Out-Null

  Write-Output "Restore completed into database: $DatabaseName"
}
catch {
  if ($created) {
    & $ContainerCli exec $ContainerName dropdb --no-password --if-exists --username $DatabaseAdminUser $DatabaseName 2>$null | Out-Null
  }
  throw
}
finally {
  & $ContainerCli exec $ContainerName rm -f $containerDumpPath $containerGlobalsPath 2>$null | Out-Null
}
