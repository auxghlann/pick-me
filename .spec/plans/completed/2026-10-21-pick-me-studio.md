# Pick Me Studio (Visual `.typ` Editor & PDF Exporter) Implementation Plan

> **Status:** Completed (2026-10-21)

**Goal:** Build a zero-dependency local web studio (`scripts/studio.ps1` + `templates/studio/`) that lets users load or upload any `pick-me` resume or cover letter `.typ` file, edit content through an abstracted form UI (or raw `.typ`), and recompile to PDF in real time without spending LLM tokens.  
**Architecture:** A lightweight PowerShell `System.Net.Sockets.TcpListener` server (`scripts/studio.ps1`) serves static modular assets from `templates/studio/` (`index.html`, `studio.css`, `studio.js`) and exposes JSON/binary REST endpoints (`/api/files`, `/api/load`, `/api/compile`, `/api/pdf`). The frontend parses deterministic `modern-clean.typ` and `clean-letter.typ` structures into editable form cards synced bidirectionally with raw `.typ` source and a live PDF `<iframe>` preview.  
**Tech Stack:** PowerShell (`System.Net.Sockets.TcpListener`), Vanilla HTML5/CSS3/JS (zero external dependencies), Typst CLI.  

## Rulings Ledger
- `Ruling: Use System.Net.Sockets.TcpListener instead of System.Net.HttpListener in scripts/studio.ps1 - Why: HttpListener relies on kernel http.sys which throws PlatformNotSupportedException/AccessDenied in restricted environments, whereas user-space TcpListener on 127.0.0.1 works universally without admin privileges or URL ACLs - Cost if wrong: Zero.`
- `Ruling: Wrap Test-Path in Test-PathSafe helper with -ErrorAction SilentlyContinue - Why: Under $ErrorActionPreference = "Stop", probing paths outside restricted sandboxes throws terminating UnauthorizedAccessException - Cost if wrong: Zero.`
- `Ruling: Modularize frontend into index.html, studio.css, and studio.js - Why: Maintainability and separation of styling tokens, parsing logic, and markup skeleton - Cost if wrong: Zero.`
- `Ruling: Never wrap header buttons on narrow viewports; use nowrap and horizontal scrolling - Why: Multi-row wrapping inside fixed 56px header causes buttons to physically collide and overlap - Cost if wrong: Zero.`

## Completed Tasks
- [x] **Task 1: PowerShell Local Studio Server (`scripts/studio.ps1`)**
  - Serves static modular assets (`.css`, `.js`, `.svg`, `.html`) with MIME mapping and directory traversal security.
  - Exposes REST endpoints for file listing, loading, Typst compilation, and PDF delivery.
- [x] **Task 2: Modular Abstracted Studio Frontend (`templates/studio/`)**
  - Modularized into `index.html`, `studio.css`, and `studio.js`.
  - Built bidirectional parsers and serializers for resumes, cover letters, and free-form Typst documents.
- [x] **Task 3: Dark Mode Textarea Fix**
  - Enforced `#000000` background and `#ffffff` text across all multiline fields and summary textareas.
- [x] **Task 4: Redundant PDF Toolbar Removal & Theme Icon Relocation**
  - Removed top PDF preview toolbar to maximize vertical viewing canvas.
  - Relocated theme button to top header bar before the view mode segmented switch.
- [x] **Task 5: Draggable Split-Pane Resizer Slider**
  - Implemented pointer-capture dragging between editor and preview panes with bounds clamping and iframe event shielding.
- [x] **Task 6: Robust File Upload & Drag-and-Drop**
  - Replaced button with native `<label for="file-upload">` and broadened accept filter.
  - Added full drag-and-drop support across the window.
  - Dynamically updates active dropdown with `[Uploaded] filename.typ`.
- [x] **Task 7: Full Media & Mobile Responsiveness**
  - Single-row header with zero button collisions or merging.
  - Single-panel mobile view mode toggled by expanded `[ Form | Typst | Preview ]` switch below 860px.
- [x] **Task 8: Builder Skills & Agent Guidelines Integration**
  - Updated `skills/resume-builder/SKILL.md`, `skills/cover-letter-builder/SKILL.md`, and `rules/AGENTS.md` with post-generation editing guidance.
