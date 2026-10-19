---
name: resume-builder
description: Tailors an ATS-optimized single-column Typst resume from candidate-profile.yaml for a target job description and compiles it to PDF.
---

# Skill: resume-builder

## Overview
This skill tailors an ATS-compliant, single-column Typst resume for a specific target Job Description (JD). It extracts verified achievements from `data/candidate-profile.yaml` and `data/star-stories.md`, drafts 1:1 resume content with verified metrics, requires user approval via a plan artifact, and compiles the result to PDF.

---

## Prerequisites & Sources of Truth
- Primary data source: `data/candidate-profile.yaml` (experience, skills, projects, education).
- Story & metrics bank: `data/star-stories.md` (quantified outcomes and technical details).
- Target tracker: `data/applications.csv` (used to determine application ID).
- Compilation script: `skills/typst-pdf/scripts/compile.ps1`.
- Base template: `templates/resume/modern-clean.typ`.

---

## File Naming & Directory Standards
All generated files follow this standardized structure:
- **Output Directory**: `~/Documents/pick-me-output/applications/<app_id>_<company_name>/` (e.g., `~/Documents/pick-me-output/applications/APP-005_google/`)
- **Application ID (`<app_id>`)**: Uppercase tracking ID sourced from `data/applications.csv` if updating an existing record, or the next sequential ID (e.g., `APP-012`).
- **Typst Source File**: `~/Documents/pick-me-output/applications/<app_id>_<company_name>/resume_<company_name>.typ`
- **Compiled PDF File**: `~/Documents/pick-me-output/applications/<app_id>_<company_name>/resume_<company_name>.pdf`

---

## Step-by-Step Procedure

### 1. Ingest Job Description & Identify Scope
- Read target job description to extract:
  - Role title, seniority level, and required tech stack.
  - Core domain challenges and primary qualifications.
- Check `data/applications.csv` to identify or reserve `<app_id>`.

### 2. Select & Prioritize Verified Content (With Strict Entity Isolation)
- Cross-reference JD keywords against `data/candidate-profile.yaml` and `data/star-stories.md` while strictly respecting each entry's `domain` and `scope_boundary`:
  - **Entity Isolation Rule (No Chimera Synthesis)**: Treat each `experience[]` entry and each `projects[]` entry as a sealed container. Never borrow keywords, tools, or concepts from a project (e.g., Data Engineering `dbt` or transactional data integrity) and graft them onto an unrelated work experience or internship (e.g., Software QA / SIT application module testing).
  - **Summary**: 2-3 sentence overview tailored to the target role. Never fuse unrelated work experience and personal projects into a single blended clause (e.g., do not combine `dbt` data pipeline tasks with `SIT` internship testing as if they were the same activity). If mentioning both, separate them into distinct clauses or focus the summary strictly on the target domain.
  - **Technical Skills**: Order technologies so JD-requested tools appear first (never add unverified skills).
  - **Work Experience**: Select 3-5 highlights per role matching JD priorities, following the Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]"). Mirroring JD terminology is strictly limited to synonyms **within that role's own `domain` and `scope_boundary`**.
  - **Projects**: Select 1-2 most relevant projects demonstrating JD-adjacent technical depth.
  - **Skill Gaps**: Note any required technologies missing from the candidate's profile honestly.

### 3. Mandatory Pre-Generation Plan Review Gate (Hard Stop)
Before creating or modifying any `.typ` file, author an implementation plan artifact containing the complete 1:1 drafted content:
- Verbatim Professional Summary, with an inline `[Source: <entity_name> | Domain: <domain>]` audit tag for each claim verifying zero cross-entity conflation.
- Verbatim ordered Technical Skills.
- Verbatim Work Experience entries, titles, dates, and bullet points, with `[Source: experience/<company> | Domain: <domain>]` confirmation.
- Verbatim Project entries, links, and bullet points, with `[Source: project/<name> | Domain: <domain>]` confirmation.
- Identified skill gaps and rationale for selected highlights.
- Set `RequestFeedback: true` in `write_to_file`.
- **Halt execution** and await explicit user approval. Do not touch `.typ` files or run compilers until approved.

### 4. Populate Typst Template
Once the user approves the drafted plan:
- Read `templates/resume/modern-clean.typ`.
- Replace template placeholders with the approved content.
- Ensure the parent directory `$HOME/Documents/pick-me-output/applications/<app_id>_<company_name>/` exists.
- Write the populated file to `$HOME/Documents/pick-me-output/applications/<app_id>_<company_name>/resume_<company_name>.typ`.

### 5. Compile to PDF via PowerShell
Compile the Typst file using the compilation script:
```powershell
powershell -ExecutionPolicy Bypass -File "skills/typst-pdf/scripts/compile.ps1" -TypstFile "$HOME/Documents/pick-me-output/applications/<app_id>_<company_name>/resume_<company_name>.typ" -OutputFile "$HOME/Documents/pick-me-output/applications/<app_id>_<company_name>/resume_<company_name>.pdf"
```
Verify that the output PDF exists and has a non-zero byte size.

### 6. Pipeline Follow-Up
Prompt the user to check if the application was submitted, offering to invoke `application-tracker` to update `data/applications.csv`.

---

## Strict Constraints
- Anti-Hallucination & Entity Isolation: Zero fabrication of metrics, skills, employers, or dates, and zero cross-pollination of vocabulary between unrelated `experience[]` and `projects[]` entries.
- Clean Layout: Strict single-column, parser-friendly Typst formatting.
- Strict zero emojis across all code, Typst files, and messages.

