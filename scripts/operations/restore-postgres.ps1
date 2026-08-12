param(
  [Parameter(Mandatory = $true)]
  [string]$ContainerName,
  [Parameter(Mandatory = $true)]
  [string]$InputPath,
  [Parameter(Mandatory = $true)]
  [string]$DatabaseName,
  [string]$DatabaseUser = "personal_commerce",
  [ValidateSet("podman", "docker")]
  [string]$ContainerCli = "podman"
)

$ErrorActionPreference = "Stop"
$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path

if ($DatabaseName -eq "personal_commerce") {
  throw "Restore must target a separate verification database."
}

$containerInput = "/tmp/personal-commerce-restore-$([Guid]::NewGuid().ToString('N')).sql"

try {
  & $ContainerCli exec $ContainerName createdb --username $DatabaseUser $DatabaseName
  if ($LASTEXITCODE -ne 0) {
    throw "Restore database creation failed with exit code $LASTEXITCODE"
  }

  & $ContainerCli cp $resolvedInput "${ContainerName}:$containerInput"
  if ($LASTEXITCODE -ne 0) {
    throw "Restore file copy failed with exit code $LASTEXITCODE"
  }

  & $ContainerCli exec $ContainerName psql --set ON_ERROR_STOP=1 --username $DatabaseUser --dbname $DatabaseName --file $containerInput
  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL restore failed with exit code $LASTEXITCODE"
  }
}
finally {
  & $ContainerCli exec $ContainerName rm -f $containerInput 2>$null
}

Write-Output "Restore completed into database: $DatabaseName"
