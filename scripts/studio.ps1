# studio.ps1
# Pick Me Studio: Local HTTP server for visual .typ editing and instant PDF compilation

param(
    [Parameter(Mandatory=$false)]
    [string]$File = "",

    [Parameter(Mandatory=$false)]
    [int]$Port = 8765,

    [Parameter(Mandatory=$false)]
    [string]$OutputRoot = "",

    [Parameter(Mandatory=$false)]
    [switch]$NoBrowser = $false,

    [Parameter(Mandatory=$false)]
    [int]$MaxRequests = 0
)

$ErrorActionPreference = "Stop"

function Test-PathSafe {
    param([string]$PathToCheck)
    if (-not $PathToCheck) { return $false }
    try {
        return [bool](Test-Path -Path $PathToCheck -ErrorAction SilentlyContinue)
    }
    catch {
        return $false
    }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$StudioDir = Join-Path $RepoRoot "templates\studio"
$HtmlPath = Join-Path $StudioDir "index.html"

if (-not $OutputRoot) {
    $DocsDir = [Environment]::GetFolderPath("MyDocuments")
    if (-not $DocsDir) {
        $DocsDir = Join-Path $HOME "Documents"
    }
    $OutputRoot = Join-Path $DocsDir "pick-me-output"
}

$ScratchDir = Join-Path ([System.IO.Path]::GetTempPath()) "pick-me-studio-scratch"
if (-not (Test-PathSafe $ScratchDir)) {
    New-Item -ItemType Directory -Path $ScratchDir -Force | Out-Null
}

$InitialFileResolved = ""
if ($File -and (Test-PathSafe $File)) {
    $InitialFileResolved = (Resolve-Path $File).Path
}

function Test-AllowedStudioPath {
    param(
        [string]$CandidatePath,
        [bool]$AllowTemplates = $false,
        [string]$RequireExtension = ""
    )
    if (-not $CandidatePath) { return $false }
    try {
        $FullCandidate = [System.IO.Path]::GetFullPath($CandidatePath)
        if ($RequireExtension -and (-not $FullCandidate.EndsWith($RequireExtension, [System.StringComparison]::OrdinalIgnoreCase))) {
            return $false
        }
        $AllowedRoots = @(
            ([System.IO.Path]::GetFullPath($OutputRoot).TrimEnd('\') + '\'),
            ([System.IO.Path]::GetFullPath($ScratchDir).TrimEnd('\') + '\')
        )
        if ($AllowTemplates) {
            $AllowedRoots += ([System.IO.Path]::GetFullPath((Join-Path $RepoRoot "templates")).TrimEnd('\') + '\')
        }
        if ($InitialFileResolved) {
            $InitDir = Split-Path -Parent $InitialFileResolved
            if ($InitDir) {
                $AllowedRoots += ([System.IO.Path]::GetFullPath($InitDir).TrimEnd('\') + '\')
            }
        }
        foreach ($Root in $AllowedRoots) {
            if ($FullCandidate.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        }
        return $false
    }
    catch {
        return $false
    }
}

function Get-PdfPageCount {
    param([string]$PdfPath)
    if (-not $PdfPath -or (-not (Test-PathSafe $PdfPath))) { return 0 }
    try {
        $RawBytes = [System.IO.File]::ReadAllBytes($PdfPath)
        $Ascii = [System.Text.Encoding]::ASCII.GetString($RawBytes)
        $PageMatches = [regex]::Matches($Ascii, '/Type\s*/Page\b')
        if ($PageMatches.Count -gt 0) { return $PageMatches.Count }
        return 1
    }
    catch {
        return 0
    }
}

# Locate Typst CLI
$TypstCmd = ""
$TypstFoundCmd = Get-Command "typst" -ErrorAction SilentlyContinue
if ($TypstFoundCmd) {
    $TypstCmd = $TypstFoundCmd.Source
}
elseif ($env:LOCALAPPDATA) {
    $WingetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
    if (Test-PathSafe $WingetPath) {
        $FoundTypst = Get-ChildItem -Path $WingetPath -Filter "typst.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
        if ($FoundTypst -and (Test-PathSafe $FoundTypst)) {
            $TypstCmd = $FoundTypst
        }
    }
}

if (-not $TypstCmd) {
    Write-Warning "Typst CLI was not found on PATH. Install via: winget install -e --id Typst.Typst"
}

function Invoke-TypstCompile {
    param(
        [string]$TypPath,
        [string]$PdfPath
    )
    if (-not $TypstCmd) {
        return @{
            ok = $false
            ms = 0
            error = "Typst CLI is not installed. Run: winget install -e --id Typst.Typst"
        }
    }
    $Sw = [System.Diagnostics.Stopwatch]::StartNew()
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $TypstCmd
    $psi.Arguments = "compile `"$TypPath`" `"$PdfPath`""
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::Start($psi)
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    $Sw.Stop()

    if ($proc.ExitCode -eq 0 -and (Test-PathSafe $PdfPath)) {
        return @{
            ok = $true
            ms = $Sw.ElapsedMilliseconds
            error = ""
        }
    }
    else {
        $errText = if ($stderr) { $stderr.Trim() } else { $stdout.Trim() }
        return @{
            ok = $false
            ms = $Sw.ElapsedMilliseconds
            error = $errText
        }
    }
}

function Parse-QueryString {
    param([string]$Query)
    $Result = @{}
    if (-not $Query) { return $Result }
    $Clean = $Query.TrimStart('?')
    foreach ($Pair in ($Clean -split '&')) {
        if (-not $Pair) { continue }
        $Kv = $Pair -split '=', 2
        $Key = [System.Uri]::UnescapeDataString($Kv[0].Replace('+', ' '))
        $Val = if ($Kv.Count -gt 1) { [System.Uri]::UnescapeDataString($Kv[1].Replace('+', ' ')) } else { "" }
        $Result[$Key] = $Val
    }
    return $Result
}

function Send-HttpResponse {
    param(
        [System.IO.Stream]$Stream,
        [int]$StatusCode = 200,
        [string]$StatusText = "OK",
        [string]$ContentType = "text/plain; charset=utf-8",
        [byte[]]$BodyBytes = @(),
        [hashtable]$ExtraHeaders = @{}
    )
    $HeaderLines = @(
        "HTTP/1.1 $StatusCode $StatusText",
        "Content-Type: $ContentType",
        "Content-Length: $($BodyBytes.Length)",
        "Cache-Control: no-store, no-cache, must-revalidate",
        "Connection: close"
    )
    foreach ($K in $ExtraHeaders.Keys) {
        $HeaderLines += "${K}: $($ExtraHeaders[$K])"
    }
    $HeaderStr = ($HeaderLines -join "`r`n") + "`r`n`r`n"
    $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($HeaderStr)
    $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
    if ($BodyBytes.Length -gt 0) {
        $Stream.Write($BodyBytes, 0, $BodyBytes.Length)
    }
    $Stream.Flush()
}

function Send-JsonHttp {
    param(
        [System.IO.Stream]$Stream,
        $Payload,
        [int]$StatusCode = 200
    )
    $Json = $Payload | ConvertTo-Json -Depth 10 -Compress
    $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Json)
    $StatusText = switch ($StatusCode) {
        200 { "OK" }
        403 { "Forbidden" }
        404 { "Not Found" }
        default { "Internal Server Error" }
    }
    Send-HttpResponse -Stream $Stream -StatusCode $StatusCode -StatusText $StatusText -ContentType "application/json; charset=utf-8" -BodyBytes $Bytes
}

$PreviewTokens = [ordered]@{
    "EXPERIENCE_BLOCK_PLACEHOLDER"     = '#exp-entry(title: "Software Engineer", company: "Example Corp", location: "Remote", date: "2025 -- Present", bullets: ([Delivered core features and verified system reliability.],))'
    "PROJECTS_BLOCK_PLACEHOLDER"       = '#project-entry(name: "Sample Project", stack: "Python, SQL, dbt", date: "2026", bullets: ([Built modular ELT pipeline and automated schema tests.],))'
    "EDUCATION_BLOCK_PLACEHOLDER"      = '#block(width: 100%, breakable: false)[#grid(columns: (1fr, auto), text(weight: "bold")[Bachelor of Science in Computer Science] + text(fill: rgb("#4b5563"))[ --- State University], text(fill: rgb("#4b5563"), size: 8.3pt)[2022 -- 2026]) #v(-2.5pt) #text(size: 7.8pt, fill: rgb("#6b7280"), style: "italic")[Manila, Philippines] #v(0.5pt) #list(marker: [•], spacing: 2.2pt, [Cum Laude])]'
    "CERTIFICATIONS_BLOCK_PLACEHOLDER" = '#grid(columns: (1fr, 1fr), column-gutter: 8pt, row-gutter: 4pt, [• *Associate Data Engineer in SQL* --- DataCamp (2026)], [• *Associate Python Developer* --- DataCamp (2025)])'
    "NAME_PLACEHOLDER"                 = "Alex Rivera"
    "TITLE_PLACEHOLDER"                = "Software Engineer"
    "LOCATION_PLACEHOLDER"             = "Metro Manila, Philippines"
    "EMAIL_PLACEHOLDER"                = "alex.rivera@example.com"
    "EMAIL_DISPLAY_PLACEHOLDER"        = "alex.rivera\@example.com"
    "PHONE_PLACEHOLDER"                = "+63 900 000 0000"
    "LINKEDIN_URL_PLACEHOLDER"         = "https://linkedin.com/in/example"
    "GITHUB_URL_PLACEHOLDER"           = "https://github.com/example"
    "SUMMARY_PLACEHOLDER"              = "Software engineer focused on backend services, data pipelines, and automated system verification."
    "SKILLS_BLOCK_PLACEHOLDER"         = "[*Languages:*], [Python, SQL, TypeScript],`n  [*Frameworks & Libraries:*], [FastAPI, Playwright, React],`n  [*Tools & Platforms:*], [Git, Docker, Linux, PowerShell],`n  [*Core Methodologies:*], [System Integration Testing (SIT), Automated Testing, CI/CD],"
    "CANDIDATE_NAME"                   = "Alex Rivera"
    "CANDIDATE_TITLE"                  = "Software Engineer"
    "CANDIDATE_LOCATION"               = "Metro Manila, Philippines"
    "CANDIDATE_EMAIL_DISPLAY"          = "alex.rivera\@example.com"
    "CANDIDATE_EMAIL"                  = "alex.rivera@example.com"
    "CANDIDATE_PHONE"                  = "+63 900 000 0000"
    "CANDIDATE_LINKEDIN"               = "https://linkedin.com/in/example"
    "CANDIDATE_GITHUB"                 = "https://github.com/example"
    "DATE_PLACEHOLDER"                 = "October 27, 2026"
    "COMPANY_NAME"                     = "Example Corp"
    "COMPANY_LOCATION"                 = "Metro Manila"
    "BODY_PARAGRAPHS_PLACEHOLDER"      = "I am writing to apply for the Software Engineer position at Example Corp.`n`n#v(10pt)`nIn my recent work, I built modular backend services and automated verification pipelines.`n`n#v(10pt)`nThank you for your time and consideration."
}

$TcpListener = $null
$Bound = $false
for ($try = 0; $try -lt 10; $try++) {
    $CandidatePort = $Port + $try
    try {
        $TcpListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $CandidatePort)
        $TcpListener.Start()
        $Port = $CandidatePort
        $Bound = $true
        break
    }
    catch {
        if ($TcpListener) {
            try { $TcpListener.Stop() } catch {}
        }
    }
}

if (-not $Bound) {
    Write-Error "Could not bind TcpListener on ports $Port..$($Port + 9)."
}

$ServerUrl = "http://127.0.0.1:$Port/"
Write-Host "Pick Me Studio running at: $ServerUrl"
Write-Host "Scanning output directory: $OutputRoot"
Write-Host "Press Ctrl+C to stop the server."

if (-not $NoBrowser) {
    Start-Process $ServerUrl | Out-Null
}

$HandledCount = 0

try {
    while ($true) {
        $Client = $TcpListener.AcceptTcpClient()
        try {
            $Stream = $Client.GetStream()
            $Stream.ReadTimeout = 5000
            $Stream.WriteTimeout = 5000

            # Read HTTP header bytes until \r\n\r\n
            $HeaderBuf = New-Object System.Collections.Generic.List[byte]
            $SingleByte = New-Object byte[] 1
            $HeaderEndFound = $false
            while ($Stream.Read($SingleByte, 0, 1) -gt 0) {
                $HeaderBuf.Add($SingleByte[0])
                $Count = $HeaderBuf.Count
                if ($Count -ge 4 -and
                    $HeaderBuf[$Count - 4] -eq 13 -and
                    $HeaderBuf[$Count - 3] -eq 10 -and
                    $HeaderBuf[$Count - 2] -eq 13 -and
                    $HeaderBuf[$Count - 1] -eq 10) {
                    $HeaderEndFound = $true
                    break
                }
                if ($Count -gt 32768) { break }
            }

            if (-not $HeaderEndFound) {
                $Client.Close()
                continue
            }

            $HeaderText = [System.Text.Encoding]::ASCII.GetString($HeaderBuf.ToArray())
            $Lines = $HeaderText -split "`r`n"
            $ReqLine = $Lines[0] -split ' '
            if ($ReqLine.Count -lt 2) {
                $Client.Close()
                continue
            }

            $Method = $ReqLine[0].ToUpperInvariant()
            $RawTarget = $ReqLine[1]
            $PathParts = $RawTarget -split '\?', 2
            $Path = $PathParts[0]
            $QueryStr = if ($PathParts.Count -gt 1) { $PathParts[1] } else { "" }
            $Query = Parse-QueryString -Query $QueryStr

            $ContentLength = 0
            $OriginHeader = ""
            foreach ($Line in $Lines) {
                if ($Line -match '^Content-Length:\s*(\d+)') {
                    $ContentLength = [int]$Matches[1]
                }
                elseif ($Line -match '^Origin:\s*(.+)$') {
                    $OriginHeader = $Matches[1].Trim()
                }
            }

            $BodyBytes = New-Object byte[] $ContentLength
            $TotalRead = 0
            while ($TotalRead -lt $ContentLength) {
                $ReadNow = $Stream.Read($BodyBytes, $TotalRead, ($ContentLength - $TotalRead))
                if ($ReadNow -le 0) { break }
                $TotalRead += $ReadNow
            }

            if ($Path -eq "/" -or $Path -eq "/index.html") {
                if (-not (Test-PathSafe $HtmlPath)) {
                    $ErrBytes = [System.Text.Encoding]::UTF8.GetBytes("Studio UI file not found at $HtmlPath")
                    Send-HttpResponse -Stream $Stream -StatusCode 404 -StatusText "Not Found" -BodyBytes $ErrBytes
                }
                else {
                    $HtmlBytes = [System.IO.File]::ReadAllBytes($HtmlPath)
                    Send-HttpResponse -Stream $Stream -StatusCode 200 -StatusText "OK" -ContentType "text/html; charset=utf-8" -BodyBytes $HtmlBytes
                }
            }
            elseif (-not $Path.StartsWith("/api/")) {
                $RelPath = $Path.TrimStart('/').Replace('/', '\')
                $FilePath = Join-Path $StudioDir $RelPath
                if ((Test-PathSafe $FilePath) -and -not (Test-Path -Path $FilePath -PathType Container)) {
                    $ResolvedPath = (Resolve-Path $FilePath).Path
                    if ($ResolvedPath.StartsWith($StudioDir, [System.StringComparison]::OrdinalIgnoreCase)) {
                        $Ext = [System.IO.Path]::GetExtension($ResolvedPath).ToLowerInvariant()
                        $Mime = switch ($Ext) {
                            ".css"  { "text/css; charset=utf-8" }
                            ".js"   { "application/javascript; charset=utf-8" }
                            ".html" { "text/html; charset=utf-8" }
                            ".svg"  { "image/svg+xml; charset=utf-8" }
                            ".json" { "application/json; charset=utf-8" }
                            ".png"  { "image/png" }
                            ".ico"  { "image/x-icon" }
                            default { "application/octet-stream" }
                        }
                        $AssetBytes = [System.IO.File]::ReadAllBytes($ResolvedPath)
                        Send-HttpResponse -Stream $Stream -StatusCode 200 -StatusText "OK" -ContentType $Mime -BodyBytes $AssetBytes
                    }
                    else {
                        Send-HttpResponse -Stream $Stream -StatusCode 403 -StatusText "Forbidden"
                    }
                }
                else {
                    Send-HttpResponse -Stream $Stream -StatusCode 404 -StatusText "Not Found"
                }
            }
            elseif ($Path -eq "/api/files") {
                $FileList = @()
                $SearchDirs = @()
                if (Test-PathSafe $OutputRoot) { $SearchDirs += $OutputRoot }

                foreach ($Dir in $SearchDirs) {
                    $Found = Get-ChildItem -Path $Dir -Filter "*.typ" -Recurse -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
                    foreach ($F in $Found) {
                        $PdfCandidate = [System.IO.Path]::ChangeExtension($F.FullName, ".pdf")
                        $ParentName = Split-Path -Leaf $F.DirectoryName
                        $FileList += @{
                            path = $F.FullName
                            name = $F.Name
                            folder = $ParentName
                            label = "$ParentName / $($F.Name)"
                            updated = $F.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
                            hasPdf = (Test-PathSafe $PdfCandidate)
                        }
                    }
                }

                $TemplatesDir = Join-Path $RepoRoot "templates"
                if (Test-PathSafe $TemplatesDir) {
                    $TemplateFiles = Get-ChildItem -Path $TemplatesDir -Filter "*.typ" -Recurse -File -ErrorAction SilentlyContinue
                    foreach ($T in $TemplateFiles) {
                        $ParentName = Split-Path -Leaf $T.DirectoryName
                        $FileList += @{
                            path = $T.FullName
                            name = $T.Name
                            folder = "template:$ParentName"
                            label = "[Template] $ParentName / $($T.Name)"
                            updated = $T.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
                            hasPdf = $false
                            isTemplate = $true
                        }
                    }
                }

                Send-JsonHttp -Stream $Stream -Payload @{
                    ok = $true
                    outputRoot = $OutputRoot
                    initialFile = $InitialFileResolved
                    files = $FileList
                }
            }
            elseif ($Path -eq "/api/load") {
                $TargetPath = $Query["path"]
                if (-not $TargetPath -or (-not (Test-PathSafe $TargetPath))) {
                    Send-JsonHttp -Stream $Stream -StatusCode 404 -Payload @{
                        ok = $false
                        error = "File not found: $TargetPath"
                    }
                }
                elseif (-not (Test-AllowedStudioPath -CandidatePath $TargetPath -AllowTemplates $true -RequireExtension ".typ")) {
                    Send-JsonHttp -Stream $Stream -StatusCode 403 -Payload @{
                        ok = $false
                        error = "Access denied: path outside allowed Studio directories."
                    }
                }
                else {
                    $Resolved = (Resolve-Path $TargetPath).Path
                    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
                    $Content = [System.IO.File]::ReadAllText($Resolved, $Utf8NoBom)
                    $FileName = [System.IO.Path]::GetFileName($Resolved)

                    $IsTemplate = $Resolved.StartsWith((Join-Path $RepoRoot "templates"), [System.StringComparison]::OrdinalIgnoreCase)
                    if ($IsTemplate) {
                        $PdfPath = Join-Path $ScratchDir ([System.IO.Path]::ChangeExtension($FileName, ".pdf"))
                        $ScratchTyp = Join-Path $ScratchDir $FileName
                        $PreviewContent = $Content
                        foreach ($Token in $PreviewTokens.Keys) {
                            $PreviewContent = $PreviewContent.Replace($Token, $PreviewTokens[$Token])
                        }
                        [System.IO.File]::WriteAllText($ScratchTyp, $PreviewContent, $Utf8NoBom)
                        $CompResult = Invoke-TypstCompile -TypPath $ScratchTyp -PdfPath $PdfPath
                    }
                    else {
                        $PdfPath = [System.IO.Path]::ChangeExtension($Resolved, ".pdf")
                        $CompResult = @{ ok = (Test-PathSafe $PdfPath); error = ""; ms = 0 }
                        if (-not $CompResult.ok) {
                            $CompResult = Invoke-TypstCompile -TypPath $Resolved -PdfPath $PdfPath
                        }
                    }

                    $EncodedPdf = [System.Uri]::EscapeDataString($PdfPath)
                    $Stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    Send-JsonHttp -Stream $Stream -Payload @{
                        ok = $true
                        path = if ($IsTemplate) { "" } else { $Resolved }
                        filename = $FileName
                        content = if ($IsTemplate) { $PreviewContent } else { $Content }
                        compileOk = $CompResult.ok
                        compileError = $CompResult.error
                        pdfPath = $PdfPath
                        pdfUrl = "/api/pdf?path=$EncodedPdf&t=$Stamp"
                        pageCount = (Get-PdfPageCount -PdfPath $PdfPath)
                    }
                }
            }
            elseif ($Path -eq "/api/compile" -and $Method -eq "POST") {
                if ($OriginHeader -and ($OriginHeader -notmatch '^https?://(127\.0\.0\.1|localhost)(:\d+)?$')) {
                    Send-JsonHttp -Stream $Stream -StatusCode 403 -Payload @{
                        ok = $false
                        error = "Cross-origin requests are forbidden."
                    }
                    continue
                }

                $BodyRaw = [System.Text.Encoding]::UTF8.GetString($BodyBytes)
                $Body = $BodyRaw | ConvertFrom-Json

                $TargetPath = [string]$Body.path
                $FileName = [string]$Body.filename
                $Content = [string]$Body.content

                if (-not $FileName) { $FileName = "document.typ" }
                if (-not $FileName.EndsWith(".typ")) { $FileName = "$FileName.typ" }

                $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

                if ($TargetPath) {
                    if (-not (Test-AllowedStudioPath -CandidatePath $TargetPath -AllowTemplates $false -RequireExtension ".typ")) {
                        Send-JsonHttp -Stream $Stream -StatusCode 403 -Payload @{
                            ok = $false
                            error = "Access denied: cannot write outside allowed Studio output directories."
                        }
                        continue
                    }
                    if (Test-PathSafe (Split-Path -Parent $TargetPath)) {
                        $TypToWrite = [System.IO.Path]::GetFullPath($TargetPath)
                    }
                    else {
                        $SafeName = [System.IO.Path]::GetFileName($FileName)
                        $TypToWrite = Join-Path $ScratchDir $SafeName
                    }
                }
                else {
                    $SafeName = [System.IO.Path]::GetFileName($FileName)
                    $TypToWrite = Join-Path $ScratchDir $SafeName
                }

                $PdfToWrite = [System.IO.Path]::ChangeExtension($TypToWrite, ".pdf")
                [System.IO.File]::WriteAllText($TypToWrite, $Content, $Utf8NoBom)

                $Comp = Invoke-TypstCompile -TypPath $TypToWrite -PdfPath $PdfToWrite
                $EncodedPdf = [System.Uri]::EscapeDataString($PdfToWrite)
                $Stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

                Send-JsonHttp -Stream $Stream -Payload @{
                    ok = $Comp.ok
                    ms = $Comp.ms
                    error = $Comp.error
                    path = $TypToWrite
                    filename = [System.IO.Path]::GetFileName($TypToWrite)
                    pdfPath = $PdfToWrite
                    pdfUrl = "/api/pdf?path=$EncodedPdf&t=$Stamp"
                    pageCount = (Get-PdfPageCount -PdfPath $PdfToWrite)
                }
            }
            elseif ($Path -eq "/api/pdf") {
                $PdfPath = $Query["path"]
                $Download = $Query["download"]
                if (-not $PdfPath -or (-not (Test-PathSafe $PdfPath))) {
                    Send-HttpResponse -Stream $Stream -StatusCode 404 -StatusText "Not Found"
                }
                elseif (-not (Test-AllowedStudioPath -CandidatePath $PdfPath -AllowTemplates $false -RequireExtension ".pdf")) {
                    Send-HttpResponse -Stream $Stream -StatusCode 403 -StatusText "Forbidden"
                }
                else {
                    $ResolvedPdf = (Resolve-Path $PdfPath).Path
                    $PdfBytes = [System.IO.File]::ReadAllBytes($ResolvedPdf)
                    $PdfName = [System.IO.Path]::GetFileName($ResolvedPdf)
                    $Disp = if ($Download -eq "1") { "attachment; filename=`"$PdfName`"" } else { "inline; filename=`"$PdfName`"" }
                    Send-HttpResponse -Stream $Stream -StatusCode 200 -StatusText "OK" -ContentType "application/pdf" -BodyBytes $PdfBytes -ExtraHeaders @{
                        "Content-Disposition" = $Disp
                    }
                }
            }
            else {
                Send-HttpResponse -Stream $Stream -StatusCode 404 -StatusText "Not Found"
            }
        }
        catch {
            try {
                Send-JsonHttp -Stream $Stream -StatusCode 500 -Payload @{
                    ok = $false
                    error = $_.Exception.Message
                }
            }
            catch {}
        }
        finally {
            try { $Client.Close() } catch {}
        }

        $HandledCount++
        if ($MaxRequests -gt 0 -and $HandledCount -ge $MaxRequests) {
            break
        }
    }
}
finally {
    if ($TcpListener) {
        try { $TcpListener.Stop() } catch {}
    }
}
