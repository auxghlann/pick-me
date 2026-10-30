# Phase 1: Backend Security Hardening, Script Simplification & Page Count Implementation Plan

> **For agentic workers:** Execute this plan task-by-task using TDD and continuous execution ("Rulings, Not Stalls"). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Pick Me Studio's local HTTP server against arbitrary file read/write and cross-origin requests, remove dead PowerShell wrapper scripts, simplify template preview token replacement, and return compiled PDF page counts.  
**Architecture:** Enforces path canonicalization and directory allowlisting (`$OutputRoot`, `$ScratchDir`, and read-only `$RepoRoot\templates`) plus `Origin` validation inside `scripts/studio.ps1`, deletes the broken `scripts/compile-typst.ps1` wrapper, and extracts PDF page counts directly from compiled PDF byte streams.  
**Tech Stack:** PowerShell 5.1+ / 7+, .NET `System.Net.Sockets.TcpListener`, Node.js `node:test`, Typst CLI.  

## Global Constraints
- PowerShell scripts must remain compatible with both Windows PowerShell 5.1 and PowerShell 7+.
- Zero external PowerShell module or npm dependencies.
- Strictly zero emojis across code, comments, and documentation.
- Never run `git commit` without explicit user confirmation.

## Review Focus
1. **Arbitrary File Read via `/api/load` or `/api/pdf`**: Requesting `?path=C:\Windows\win.ini` or `?path=..\..\data\candidate-profile.yaml` must return HTTP `403 Forbidden` (not `200 OK`).
2. **Arbitrary File Overwrite via `POST /api/compile`**: Posting `{ path: "C:\\...\\templates\\resume\\modern-clean.typ", content: "..." }` or any path outside `$OutputRoot` and `$ScratchDir` must return HTTP `403 Forbidden`.
3. **Cross-Origin POST to `/api/compile`**: A browser request with an `Origin` header not matching `http://127.0.0.1:<Port>` or `http://localhost:<Port>` must return HTTP `403 Forbidden`.
4. **Template Preview Loading**: Loading `templates/resume/modern-clean.typ` or `templates/cover-letter/clean-letter.typ` via `/api/load` must still replace all placeholder tokens via the consolidated `$PreviewTokens` loop and compile a preview PDF in `$ScratchDir`.
5. **PDF Page Count Extraction**: `/api/load` and `/api/compile` must return an integer `pageCount >= 1` for every valid compiled PDF.

---

### Task 1: Delete Dead Wrapper `scripts/compile-typst.ps1` & Clean `.gitignore`

**Files:**
- Delete: `scripts/compile-typst.ps1`
- Modify: `.gitignore:22-25`
- Test: `tests/unit/studio.test.js`

**Interfaces:**
- Consumes: Repository file tree (`scripts/`, `.gitignore`).
- Produces: Single canonical `scripts/compile.ps1` entrypoint and clean `.gitignore` without case-ambiguous `rules/agents.md`.

- [ ] **Step 1: Write the failing test**
  Add assertion in `tests/unit/studio.test.js` under `Template & Script Hygiene`:
  ```javascript
  test("dead wrapper scripts/compile-typst.ps1 and stale .gitignore rules/agents.md are removed", () => {
    assert.ok(!fs.existsSync(path.join(repoRoot, "scripts/compile-typst.ps1")), "scripts/compile-typst.ps1 must be deleted");
    const gitignore = fs.readFileSync(path.join(repoRoot, ".gitignore"), "utf8");
    assert.ok(!gitignore.includes("rules/agents.md"), ".gitignore must not contain case-ambiguous rules/agents.md");
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test tests/unit/studio.test.js`
  Expected: FAIL (`scripts/compile-typst.ps1 must be deleted`)

- [ ] **Step 3: Delete `scripts/compile-typst.ps1` and remove `rules/agents.md` from `.gitignore`**
  Remove `scripts/compile-typst.ps1` and delete line 23 (`rules/agents.md`) from `.gitignore`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test tests/unit/studio.test.js`
  Expected: PASS

---

### Task 2: Path Boundary Guard, Origin Validation, Preview Token Loop & Page Count in `scripts/studio.ps1`

**Files:**
- Modify: `scripts/studio.ps1:72-115, 240-265, 355-480`
- Test: `tests/unit/studio.test.js`

**Interfaces:**
- Consumes: Raw HTTP request headers (`Origin`) and file paths (`$Query["path"]`, `$Body.path`).
- Produces:
  - `Test-AllowedStudioPath -CandidatePath <string> -AllowTemplates <bool> -RequireExtension <string>`: returns `$true` only when the canonical full path is inside `$OutputRoot`, `$ScratchDir`, or (when `-AllowTemplates` is set) `$RepoRoot\templates`, and matches `-RequireExtension`.
  - `Get-PdfPageCount -PdfPath <string>`: returns integer page count parsed from `/Type\s*/Page\b` (excluding `/Pages`) in the PDF file.
  - `pageCount` integer field in `/api/load` and `/api/compile` JSON responses.

- [ ] **Step 1: Write the failing test**
  Add a test in `tests/unit/studio.test.js` verifying `scripts/studio.ps1` defines `Test-AllowedStudioPath`, `Get-PdfPageCount`, Origin validation on `/api/compile`, and uses a hashtable loop instead of 26 sequential `.Replace(` calls:
  ```javascript
  test("studio.ps1 enforces path boundary guards, Origin checks, compact preview loop, and pageCount", () => {
    const studioPs1 = fs.readFileSync(path.join(repoRoot, "scripts/studio.ps1"), "utf8");
    assert.ok(studioPs1.includes("function Test-AllowedStudioPath"), "studio.ps1 must define Test-AllowedStudioPath");
    assert.ok(studioPs1.includes("function Get-PdfPageCount"), "studio.ps1 must define Get-PdfPageCount");
    assert.ok(studioPs1.includes("pageCount"), "studio.ps1 must return pageCount in JSON payloads");
    const replaceCount = (studioPs1.match(/\$PreviewContent\s*=\s*\$PreviewContent\.Replace\(/g) || []).length;
    assert.ok(replaceCount <= 1, `Expected loop-based preview replacement, found ${replaceCount} sequential .Replace calls`);
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test tests/unit/studio.test.js`
  Expected: FAIL (`studio.ps1 must define Test-AllowedStudioPath`)

- [ ] **Step 3: Implement `Test-AllowedStudioPath`, Origin check, `$PreviewTokens` loop, and `Get-PdfPageCount` in `scripts/studio.ps1`**
  1. Add `Test-AllowedStudioPath` and `Get-PdfPageCount` helper functions.
  2. Enforce `Test-AllowedStudioPath -CandidatePath $TargetPath -AllowTemplates $true -RequireExtension ".typ"` in `/api/load` (returning HTTP `403` on violation).
  3. Enforce `Origin` header check (when `Origin` header is present, must match `^https?://(127\.0\.0\.1|localhost)(:\d+)?$`) and `Test-AllowedStudioPath -CandidatePath $TargetPath -AllowTemplates $false -RequireExtension ".typ"` in `POST /api/compile` (returning HTTP `403` on violation).
  4. Enforce `Test-AllowedStudioPath -CandidatePath $PdfPath -AllowTemplates $false -RequireExtension ".pdf"` in `/api/pdf` (returning HTTP `403` on violation).
  5. Replace the 26 sequential `$PreviewContent = $PreviewContent.Replace(...)` lines with a `$PreviewTokens = [ordered]@{ ... }` loop.
  6. Include `pageCount = (Get-PdfPageCount -PdfPath $PdfPath)` in `/api/load` and `/api/compile` JSON responses.

- [ ] **Step 4: Run unit and E2E test suites to verify they pass**
  Run:
  - `node --test tests/unit/studio.test.js`
  - `powershell -ExecutionPolicy Bypass -File tests/e2e/run-e2e.ps1`
  Expected: PASS (0 failures)

