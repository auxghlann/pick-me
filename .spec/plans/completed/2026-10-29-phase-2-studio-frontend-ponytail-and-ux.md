# Phase 2: Studio Frontend Ponytail Deduplication, DOM XSS Fix & UX Enhancements Implementation Plan

> **For agentic workers:** Execute this plan task-by-task using TDD and continuous execution ("Rulings, Not Stalls"). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~176 lines of duplicated DOM card-building code across `editor.js` and `studio.js`, fix the section-title DOM XSS vector, add visual section reordering (Move Up / Move Down), upgrade truncated `#let exp-entry` and `#let project-entry` macro bodies so `location` and `date` always render in compiled PDFs, and surface the compiled PDF page count in the Studio status bar.  
**Architecture:** Consolidates the 4 repetitive card/bullet-list builders in `templates/studio/editor.js` into a single `createEntityCard` primitive, replaces unsafe `innerHTML` string interpolation of user-supplied section titles with `.textContent`, upgrades truncated macro definitions in `normalizeStylePreamble` (`templates/studio/parser.js`) using `upgradeMacroIfTruncated`, ensures single-element bullet tuples emit trailing commas in `serializeResume`, and updates `templates/studio/studio.js` to display page counts returned by Phase 1.  
**Tech Stack:** Vanilla ES6+ JavaScript (Browser + CommonJS dual export), Node.js `node:test`, Playwright E2E.  

## Global Constraints
- Zero frontend dependencies or build step (`parser.js`, `editor.js`, and `studio.js` load directly in browser via `<script>` tags and in Node via `require()`).
- Saving and compiling must remain strictly manual (`Ctrl+S` or **Save & Compile** button; no debounced auto-save/auto-compile).
- Strictly zero emojis across code, UI labels, comments, and documentation.
- Never run `git commit` without explicit user confirmation.

## Review Focus
1. **DOM XSS in Section Summary Titles**: A resume containing `#section-title("<img src=x onerror=alert(1)>")` must render the literal text inside `.summary-left` via `.textContent` without injecting HTML elements into the DOM.
2. **Section Reordering Bounds**: Clicking **Move Up** on index `0` or **Move Down** on the last section (`sections.length - 1`) must be a safe no-op (disabled button), while moving an interior section swaps it cleanly in `parsed.sections`, calls `onSync()`, and re-renders.
3. **Entity Card Parity**: Editing role titles, project names, education degrees, or bullet items through the consolidated `createEntityCard` helper must update the underlying `parsed` AST and card header live on input.
4. **Macro Signature & Body Rendering Normalization (`exp-entry` `location` & `project-entry` `date`)**: When a resume's `stylePreamble` contains a truncated `#let exp-entry` (whose body omits `#location`) or `#let project-entry` (whose body omits `#date`, as in `APP-029_goodman-tech`), `normalizeStylePreamble` upgrades the macro definition to the canonical `modern-clean.typ` macro so `#location` and `#date` render visibly in the PDF.
5. **Page Count Status Display**: When `/api/load` or `/api/compile` returns `pageCount`, `studio.js` displays the page count in `#status-text` (e.g., `Saved (137ms, 1 page)`).

---

### Task 1: Upgrade Truncated Macro Bodies in `normalizeStylePreamble` (`templates/studio/parser.js`) & Trim Unused State (`templates/studio/studio.js`)

**Files:**
- Modify: `templates/studio/parser.js:573-675`
- Modify: `templates/studio/studio.js:18-45`
- Modify: `C:\Users\Khester Mesa\Documents\pick-me-output\applications\APP-029_goodman-tech\resume_goodman-tech.typ`
- Test: `tests/unit/studio.test.js`

**Interfaces:**
- Consumes: Raw Typst `stylePreamble` string.
- Produces:
  - `upgradeMacroIfTruncated(preamble, macroName, requiredTokens, canonicalDef)` in `templates/studio/parser.js`.
  - `normalizeStylePreamble(preamble)` that upgrades any `#let exp-entry` missing `#location` in its body or `#let project-entry` missing `#date` in its body to the canonical `modern-clean.typ` definition.
  - Repaired `APP-029_goodman-tech/resume_goodman-tech.typ` and `.pdf` rendering project dates and company location.

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `upgradeMacroIfTruncated` in `templates/studio/parser.js`, update `APP-029_goodman-tech/resume_goodman-tech.typ`, and trim dead code in `templates/studio/studio.js`**
- [x] **Step 4: Run test to verify it passes**

---

### Task 2: Deduplicate `editor.js` Card Builders, Fix DOM XSS & Add Section Reordering + Page Count Display

**Files:**
- Modify: `templates/studio/editor.js`
- Modify: `templates/studio/studio.js:415-470`
- Test: `tests/unit/studio.test.js`

**Interfaces:**
- Consumes: `parsed` AST (`sections`, `paragraphs`) and `/api/load` + `/api/compile` response `{ ms, pageCount }`.
- Produces:
  - `createEntityCard({ titleText, deleteTitle, onDelete, rows, bullets, bulletPlaceholder, addBulletLabel })` in `templates/studio/editor.js` (reducing `editor.js` from 748 lines to 573 lines).
  - `moveSection(sections, fromIdx, toIdx)` in `templates/studio/editor.js` wired to Move Up / Move Down buttons in section headers.
  - XSS-safe `.textContent` rendering for section titles and card headers.
  - Page count display in `studio.js` (`Saved (137ms, 1 page)`).

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `createEntityCard`, `moveSection`, XSS fix in `editor.js` and `pageCount` display in `studio.js`**
- [x] **Step 4: Run unit and E2E test suites to verify they pass**

