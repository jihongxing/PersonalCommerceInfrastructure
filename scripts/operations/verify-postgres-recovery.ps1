param(
  [Parameter(Mandatory = $true)]
  [string]$SourceContainerName,
  [Parameter(Mandatory = $true)]
  [string]$SourceDatabaseName,
  [Parameter(Mandatory = $true)]
  [string]$SourceDatabaseUser,
  [Parameter(Mandatory = $true)]
  [string]$TargetContainerName,
  [Parameter(Mandatory = $true)]
  [string]$TargetDatabaseName,
  [Parameter(Mandatory = $true)]
  [string]$TargetDatabaseUser,
  [ValidateSet("podman", "docker")]
  [string]$ContainerCli = "podman"
)

$ErrorActionPreference = "Stop"

function Invoke-PsqlLines {
  param(
    [string]$ContainerName,
    [string]$DatabaseName,
    [string]$DatabaseUser,
    [string]$Sql
  )

  $output = & $ContainerCli exec $ContainerName psql --no-password --username $DatabaseUser --dbname $DatabaseName --tuples-only --no-align --quiet --command $Sql 2>&1
  if ($LASTEXITCODE -ne 0) {
    $message = ($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    throw "PostgreSQL verification query failed: $message"
  }
  return @($output | ForEach-Object { $_.ToString().TrimEnd() } | Where-Object { $_.Trim().Length -gt 0 })
}

function Compare-Lines {
  param([string]$Label, [string[]]$Source, [string[]]$Target)

  $sourceText = ($Source -join "`n")
  $targetText = ($Target -join "`n")
  if ($sourceText -ne $targetText) {
    throw "$Label differs between source and restored target."
  }
  Write-Output "${Label}: PASS"
}

function Get-DatabasePrivilegesSql {
  return @"
select coalesce(r.rolname, 'PUBLIC') || '|' || p.privilege_type || '|' || p.is_grantable
from pg_database d
cross join lateral aclexplode(coalesce(d.datacl, acldefault('d', d.datdba))) p
left join pg_roles r on r.oid = p.grantee
where d.datname = current_database()
order by 1;
"@
}

$sourceVersion = Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser "select current_setting('server_version');"
$targetVersion = Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser "select current_setting('server_version');"
Compare-Lines 'Server version' $sourceVersion $targetVersion

$sourceOwner = Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser "select pg_get_userbyid(datdba) from pg_database where datname = current_database();"
$targetOwner = Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser "select pg_get_userbyid(datdba) from pg_database where datname = current_database();"
Compare-Lines 'Database owner' $sourceOwner $targetOwner

$sourceExtensions = Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser "select coalesce(string_agg(extname || '=' || extversion, ',' order by extname), '') from pg_extension;"
$targetExtensions = Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser "select coalesce(string_agg(extname || '=' || extversion, ',' order by extname), '') from pg_extension;"
Compare-Lines 'Extensions' $sourceExtensions $targetExtensions

$rolesSql = "select rolname || '|' || rolcanlogin || '|' || rolsuper || '|' || rolcreaterole || '|' || rolcreatedb || '|' || rolreplication || '|' || rolbypassrls || '|' || (rolpassword is not null) from pg_roles where rolname !~ '^pg_' order by rolname;"
$sourceRoles = Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser $rolesSql
$targetRoles = Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser $rolesSql
$sourceRoleNames = @($sourceRoles | ForEach-Object { $_.Split('|')[0] })
$targetRoleMap = @{}
foreach ($role in $targetRoles) { $targetRoleMap[$role.Split('|')[0]] = $role }
foreach ($role in $sourceRoles) {
  $name = $role.Split('|')[0]
  if (-not $targetRoleMap.ContainsKey($name) -or $targetRoleMap[$name] -ne $role) {
    throw "Role definition differs or is missing after restore: $name"
  }
}
$unexpectedRoles = @($targetRoles | ForEach-Object { $_.Split('|')[0] } | Where-Object { $_ -notin $sourceRoleNames -and $_ -ne $TargetDatabaseUser })
if ($unexpectedRoles.Count -gt 0) { throw "Unexpected non-system roles exist in restored target: $($unexpectedRoles -join ', ')" }
Write-Output 'Roles and password-presence metadata: PASS'

$membershipsSql = "select member.rolname || '|' || parent.rolname || '|' || m.admin_option from pg_auth_members m join pg_roles parent on parent.oid=m.roleid join pg_roles member on member.oid=m.member order by 1;"
Compare-Lines 'Role memberships' (Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser $membershipsSql) (Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser $membershipsSql)
Compare-Lines 'Database privileges' (Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser (Get-DatabasePrivilegesSql)) (Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser (Get-DatabasePrivilegesSql))

$schemasSql = "select nspname || '|' || pg_get_userbyid(nspowner) || '|' || coalesce(nspacl::text, '') from pg_namespace where nspname not like 'pg_%' and nspname <> 'information_schema' order by nspname;"
Compare-Lines 'Schema owners and ACLs' (Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser $schemasSql) (Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser $schemasSql)

$relationsSql = "select n.nspname || '.' || c.relname || '|' || c.relkind::text || '|' || pg_get_userbyid(c.relowner) || '|' || coalesce(c.relacl::text, '') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname not like 'pg_%' and n.nspname <> 'information_schema' and c.relkind in ('r','p','v','m','S','f') order by 1;"
Compare-Lines 'Relation owners and ACLs' (Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser $relationsSql) (Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser $relationsSql)

$functionsSql = "select n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')|' || pg_get_userbyid(p.proowner) || '|' || coalesce(p.proacl::text, '') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname not like 'pg_%' and n.nspname <> 'information_schema' and not exists (select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e') order by 1;"
Compare-Lines 'Function owners and ACLs' (Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser $functionsSql) (Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser $functionsSql)

$columnsSql = "select table_schema || '.' || table_name || '|' || ordinal_position || '|' || column_name || '|' || data_type || '|' || is_nullable || '|' || coalesce(column_default, '') from information_schema.columns where table_schema not in ('pg_catalog','information_schema') order by 1;"
Compare-Lines 'Schema columns' (Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser $columnsSql) (Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser $columnsSql)

$journalSql = "select id || '|' || hash || '|' || created_at from drizzle.__drizzle_migrations order by id;"
Compare-Lines 'Migration Journal' (Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser $journalSql) (Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser $journalSql)

$countsSql = "select table_schema || '.' || table_name || '|' || (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), true, false, '')))[1]::text from information_schema.tables where table_type='BASE TABLE' and table_schema not in ('pg_catalog','information_schema') order by 1;"
Compare-Lines 'Table row counts' (Invoke-PsqlLines $SourceContainerName $SourceDatabaseName $SourceDatabaseUser $countsSql) (Invoke-PsqlLines $TargetContainerName $TargetDatabaseName $TargetDatabaseUser $countsSql)

Write-Output 'PostgreSQL recovery comparison: PASS'
