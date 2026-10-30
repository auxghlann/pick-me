# scripts/compile.ps1
# Compiles Typst source files to PDF with automatic output delegation to ~/Documents/pick-me-output/

param(
    [Parameter(Mandatory=$true)]
    [string]$TypstFile,

    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "",

    [Parameter(Mandatory=$false)]
    [string]$AppFolder = "",

    [Parameter(Mandatory=$false)]
    [switch]$AutoInstall = $false
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $TypstFile)) {
    Write-Error "Source Typst file not found: $TypstFile"
}

$ResolvedTypstFile = (Resolve-Path $TypstFile).Path
$FileNameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($ResolvedTypstFile)
$FileName = [System.IO.Path]::GetFileName($ResolvedTypstFile)

# Determine repo root (script is at <repoRoot>/scripts/compile.ps1)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

# Documents output base
$DocsBase = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "pick-me-output"
$ApplicationsBase = Join-Path $DocsBase "applications"

# Relocation Guard:
# If the Typst source is inside the repository (and not in templates/ or tests/),
# automatically relocate it to ~/Documents/pick-me-output/applications/<AppFolder>/
$IsInRepo = $ResolvedTypstFile.StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)
$IsTemplate = $ResolvedTypstFile.StartsWith((Join-Path $RepoRoot "templates"), [System.StringComparison]::OrdinalIgnoreCase)
$IsTest = $ResolvedTypstFile.StartsWith((Join-Path $RepoRoot "tests"), [System.StringComparison]::OrdinalIgnoreCase)

if ($IsInRepo -and (-not $IsTemplate) -and (-not $IsTest)) {
    $TargetFolder = $AppFolder
    if (-not $TargetFolder) {
        $ParentFolderName = Split-Path -Leaf (Split-Path -Parent $ResolvedTypstFile)
        if ($ParentFolderName -match '^APP-\d+') {
            $TargetFolder = $ParentFolderName
        }
    }
    if (-not $TargetFolder) {
        $CsvPath = Join-Path $RepoRoot "data\applications.csv"
        if (Test-Path $CsvPath) {
            $LastRow = Import-Csv $CsvPath -ErrorAction SilentlyContinue | Select-Object -Last 1
            if ($LastRow -and $LastRow.App_ID -and $LastRow.Company) {
                $CleanCo = ($LastRow.Company -replace '[^A-Za-z0-9_-]', '').ToLower()
                $TargetFolder = "$($LastRow.App_ID)_$CleanCo"
            }
        }
    }
    if (-not $TargetFolder) {
        $TargetFolder = "misc"
    }

    $TargetAppDir = Join-Path $ApplicationsBase $TargetFolder
    if (-not (Test-Path $TargetAppDir)) {
        New-Item -ItemType Directory -Path $TargetAppDir -Force | Out-Null
    }

    $RelocatedTypstFile = Join-Path $TargetAppDir $FileName
    Write-Host "Relocating repository-staged file: $ResolvedTypstFile -> $RelocatedTypstFile"
    Move-Item -Path $ResolvedTypstFile -Destination $RelocatedTypstFile -Force
    $ResolvedTypstFile = $RelocatedTypstFile
    $FileDir = $TargetAppDir
    if ($OutputFile -and (Split-Path -Parent (Resolve-Path -Path (Split-Path -Parent $OutputFile) -ErrorAction SilentlyContinue)).StartsWith($RepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $OutputFile = Join-Path $TargetAppDir "$FileNameWithoutExt.pdf"
    }
} else {
    $FileDir = Split-Path -Parent $ResolvedTypstFile
}

if (-not $OutputFile) {
    $OutputFile = Join-Path $FileDir "$FileNameWithoutExt.pdf"
}
else {
    $OutDir = Split-Path -Parent $OutputFile
    if ($OutDir -and (-not (Test-Path $OutDir))) {
        New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
    }
    $OutputFile = [System.IO.Path]::GetFullPath($OutputFile)
}

# 1. Locate Typst executable
$TypstCmd = ""
if (Get-Command "typst" -ErrorAction SilentlyContinue) {
    $TypstCmd = "typst"
}
elseif ($env:LOCALAPPDATA) {
    $WingetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
    if (Test-Path $WingetPath) {
        $FoundTypst = Get-ChildItem -Path $WingetPath -Filter "typst.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
        if ($FoundTypst -and (Test-Path $FoundTypst)) {
            $TypstCmd = $FoundTypst
        }
    }
}

# 2. If not found, handle installation
if (-not $TypstCmd) {
    Write-Host ""
    Write-Host "Typst compiler was not found on your system."
    Write-Host "Typst is a fast, lightweight modern CLI markup compiler."
    
    if ($AutoInstall) {
        Write-Host "Attempting installation via Windows Package Manager (winget)..."
        & winget install -e --id Typst.Typst --accept-source-agreements --accept-package-agreements
        if (Get-Command "typst" -ErrorAction SilentlyContinue) {
            $TypstCmd = "typst"
        }
    }
    
    if (-not $TypstCmd) {
        Write-Host ""
        Write-Host "To install Typst, run:"
        Write-Host "    winget install -e --id Typst.Typst"
        Write-Host ""
        exit 1
    }
}

# 3. Compile document
Write-Host "Compiling Typst: $ResolvedTypstFile -> $OutputFile"
& $TypstCmd compile "$ResolvedTypstFile" "$OutputFile"

if ($LASTEXITCODE -eq 0 -and (Test-Path $OutputFile)) {
    Write-Host "Compilation successful: $OutputFile"
    exit 0
}
else {
    Write-Error "Typst compilation failed with exit code $LASTEXITCODE."
}

