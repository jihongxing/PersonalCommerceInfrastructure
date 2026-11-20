param(
  [Parameter(Mandatory = $true)]
  [string]$ContainerName,
  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory,
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

function Get-ContainerScalar {
  param([string[]]$Arguments)

  $output = Invoke-Container -Arguments $Arguments
  return (($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine).Trim()
}

function Get-QueryArguments {
  param([string]$Sql)

  return @(
    "exec",
    $ContainerName,
    "psql",
    "--no-password",
    "--username",
    $DatabaseAdminUser,
    "--dbname",
    $DatabaseName,
    "--tuples-only",
    "--no-align",
    "--quiet",
    "--command",
    $Sql
  )
}

$resolvedOutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutputDirectory | Out-Null

$dumpPath = Join-Path $resolvedOutputDirectory "database.dump"
$globalsPath = Join-Path $resolvedOutputDirectory "globals.sql"
$manifestPath = Join-Path $resolvedOutputDirectory "manifest.json"
$token = [Guid]::NewGuid().ToString("N")
$containerDumpPath = "/tmp/pci-eng-029-$token.dump"
$containerGlobalsPath = "/tmp/pci-eng-029-$token-globals.sql"

try {
  Invoke-Container -Arguments @(
    "exec", $ContainerName, "pg_dump", "--no-password", "--format=custom",
    "--file", $containerDumpPath, "--dbname", $DatabaseName,
    "--username", $DatabaseAdminUser
  ) | Out-Null
  Invoke-Container -Arguments @(
    "cp", "${ContainerName}:$containerDumpPath", $dumpPath
  ) | Out-Null

  Invoke-Container -Arguments @(
    "exec", $ContainerName, "pg_dumpall", "--no-password", "--globals-only",
    "--database", $DatabaseName, "--username", $DatabaseAdminUser,
    "--file", $containerGlobalsPath
  ) | Out-Null
  Invoke-Container -Arguments @(
    "cp", "${ContainerName}:$containerGlobalsPath", $globalsPath
  ) | Out-Null

  $databaseOwner = Get-ContainerScalar -Arguments (Get-QueryArguments -Sql "select pg_get_userbyid(datdba) from pg_database where datname = current_database();")
  $serverVersion = Get-ContainerScalar -Arguments (Get-QueryArguments -Sql "select current_setting('server_version');")
  $migrationCount = Get-ContainerScalar -Arguments (Get-QueryArguments -Sql "select case when to_regclass('drizzle.__drizzle_migrations') is null then 0 else (select count(*) from drizzle.__drizzle_migrations) end;")
  $extensions = Get-ContainerScalar -Arguments (Get-QueryArguments -Sql "select coalesce(string_agg(extname || '=' || extversion, ',' order by extname), '') from pg_extension;")
  $databasePrivileges = Get-ContainerScalar -Arguments (Get-QueryArguments -Sql @"
select coalesce(r.rolname, 'PUBLIC') || '|' || p.privilege_type || '|' || p.is_grantable
from pg_database d
cross join lateral aclexplode(coalesce(d.datacl, acldefault('d', d.datdba))) p
left join pg_roles r on r.oid = p.grantee
where d.datname = current_database()
order by 1;
"@)

  $dumpHash = Get-FileHash -LiteralPath $dumpPath -Algorithm SHA256
  $globalsHash = Get-FileHash -LiteralPath $globalsPath -Algorithm SHA256
  $dumpBytes = (Get-Item -LiteralPath $dumpPath).Length
  $globalsBytes = (Get-Item -LiteralPath $globalsPath).Length
  $manifest = [ordered]@{
    format = "postgresql-custom-plus-globals"
    tool = "scripts/operations/backup-postgres-full.ps1"
    createdAtUtc = [DateTime]::UtcNow.ToString("o")
    sourceContainer = $ContainerName
    databaseName = $DatabaseName
    databaseOwner = $databaseOwner
    serverVersion = $serverVersion
    migrationCount = [int]$migrationCount
    extensions = if ([string]::IsNullOrWhiteSpace($extensions)) { @() } else { @($extensions -split "`r?`n" | Where-Object { $_ }) }
    databasePrivileges = if ([string]::IsNullOrWhiteSpace($databasePrivileges)) { @() } else { @($databasePrivileges -split "`r?`n" | Where-Object { $_ }) }
    artifacts = [ordered]@{
      databaseDump = [ordered]@{ file = "database.dump"; sha256 = $dumpHash.Hash.ToLowerInvariant(); bytes = $dumpBytes }
      globals = [ordered]@{ file = "globals.sql"; sha256 = $globalsHash.Hash.ToLowerInvariant(); bytes = $globalsBytes }
    }
  }
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
  Write-Output "Backup created: $resolvedOutputDirectory"
}
finally {
  & $ContainerCli exec $ContainerName rm -f $containerDumpPath $containerGlobalsPath 2>$null | Out-Null
}
