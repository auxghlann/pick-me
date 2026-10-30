# Dynamic Studio Templates & Production Test Suite Implementation Plan

> **Status:** Completed (2026-10-27)

**Goal:** Replace rigid, multi-placeholder template sections with single elastic block placeholders (`SKILLS_BLOCK_PLACEHOLDER`, `BODY_PARAGRAPHS_PLACEHOLDER`), eliminate hardcoded PII and zombie-entry resurrections in `studio.js`, add dynamic section management in Studio UI, and replace throwable test scripts with a permanent `node:test` behavioral suite following `/saw-test` standards.  
**Architecture:** Consolidate template placeholders into stretchable block tokens in `modern-clean.typ` and `clean-letter.typ` (synchronized with `scripts/studio.ps1`). Refactor `templates/studio/studio.js` so empty lists remain empty (`[]`), resume headers render full escaped email addresses, and users can add, rename, or remove resume sections dynamically. Replace `tests/test-cover-letter.js` with `tests/unit/studio.test.js` using `node:test` and `node:assert/strict` with parameterized table-driven and round-trip idempotency tests.  
**Tech Stack:** Vanilla JavaScript (CommonJS + Browser DOM), Node.js built-in test runner (`node --test`), PowerShell 7+, Typst CLI.  

## Completed Tasks
- [x] **Task 1: Build Production Unit Test Suite (`tests/unit/studio.test.js`) Using `/saw-test`**
  - Replaced point-in-time `tests/test-cover-letter.js` with 23 table-driven and round-trip behavioral tests across 6 `describe` suites using `node:test` and `node:assert/strict`.
- [x] **Task 2: Consolidate Dynamic Placeholders in Templates & `scripts/studio.ps1`**
  - Replaced the 4 hardcoded skill category placeholders in `templates/resume/modern-clean.typ` with `SKILLS_BLOCK_PLACEHOLDER`.
  - Replaced the 3 hardcoded paragraph placeholders in `templates/cover-letter/clean-letter.typ` with `BODY_PARAGRAPHS_PLACEHOLDER`.
  - Updated `scripts/studio.ps1` to populate both resume and cover letter template previews and return `$PreviewContent` when loading a template so form fields and PDF previews match immediately.
- [x] **Task 3: Refactor `templates/studio/studio.js` for Elastic Sections, Zero PII, and Full Resume Email**
  - Updated `serializeHeader` to output full escaped email addresses (`user\@domain.com`).
  - Removed hardcoded PII and fallback entry injections when `entries.length === 0` so deleted items stay deleted (`0..N` elasticity).
  - Added per-section delete buttons and a bottom `+ Add section` bar (`Skills Grid`, `Experience List`, `Projects List`, `Education`, `Certifications`, `Text Block`) in `renderResumeForm`.
- [x] **Task 4: Modularize Studio Frontend (`parser.js`, `editor.js`, `studio.js`)**
  - Extracted pure Typst AST parser and serializer into `templates/studio/parser.js` (zero DOM dependencies).
  - Extracted visual form DOM builders and shared `createContactSection` helper into `templates/studio/editor.js`.
  - Slimmed `templates/studio/studio.js` down from 1,914 lines to ~495 lines (application state, workspace resizer, and `/api/*` handlers).

