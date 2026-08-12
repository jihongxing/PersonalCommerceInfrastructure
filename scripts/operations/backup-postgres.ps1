param(
  [Parameter(Mandatory = $true)]
  [string]$ContainerName,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath,
  [string]$DatabaseName = "personal_commerce",
  [string]$DatabaseUser = "personal_commerce",
  [ValidateSet("podman", "docker")]
  [string]$ContainerCli = "podman"
)

$ErrorActionPreference = "Stop"
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$parent = Split-Path -Parent $resolvedOutput
New-Item -ItemType Directory -Force -Path $parent | Out-Null

$dump = & $ContainerCli exec $ContainerName pg_dump --clean --if-exists --no-owner --username $DatabaseUser $DatabaseName

if ($LASTEXITCODE -ne 0) {
  throw "PostgreSQL backup failed with exit code $LASTEXITCODE"
}

[System.IO.File]::WriteAllText(
  $resolvedOutput,
  (($dump -join [Environment]::NewLine) + [Environment]::NewLine),
  [System.Text.UTF8Encoding]::new($false)
)

Write-Output "Backup created: $resolvedOutput"
