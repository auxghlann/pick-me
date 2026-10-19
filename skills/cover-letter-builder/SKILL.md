---
name: cover-letter-builder
description: Crafts authentic, high-impact cover letters grounded strictly in candidate-profile.yaml without generic AI clichés.
---

# Skill: cover-letter-builder

## Overview
This skill crafts brief, highly targeted cover letters (strictly 3-4 paragraphs, under 280 words) that bridge the candidate's verified background in `data/candidate-profile.yaml` and `data/star-stories.md` with the challenges and mission of a target employer.

---

## Prerequisites & Sources of Truth
- Primary data source: `data/candidate-profile.yaml`.
- Story & metrics bank: `data/star-stories.md`.
- Target tracker: `data/applications.csv` (used to determine application ID).
- Compilation script: `skills/typst-pdf/scripts/compile.ps1`.
- Base template: `templates/cover-letter/clean-letter.typ`.

---

## File Naming & Directory Standards
- **Output Directory**: `~/Documents/pick-me-output/applications/<app_id>_<company_name>/`
- **Application ID (`<app_id>`)**: Sourced from `data/applications.csv`.
- **Typst Source File**: `~/Documents/pick-me-output/applications/<app_id>_<company_name>/cover_letter_<company_name>.typ`
- **Compiled PDF File**: `~/Documents/pick-me-output/applications/<app_id>_<company_name>/cover_letter_<company_name>.pdf`
- **Text Justification**: Full justification in Typst (`#set par(justify: true)`).

---

## Structure: 3-to-4 Paragraph Compressed Narrative (With Strict Entity Isolation)
Keep the entire letter strictly between **200 and 280 words** across maximum 4 paragraphs:
1. **Paragraph 1: The Direct Hook (2-3 sentences)**
   - Introduce the candidate based on factual information from `candidate-profile.yaml` (education/honors, location), the target role and company, and the core domain value the candidate brings.
   - Banned openings: "I am writing to express my enthusiasm...", "I was thrilled to see...", "I believe I am the ideal candidate...".
2. **Paragraph 2: Core Engineering Match & Explicit Domain Transition (3-4 sentences)**
   - **Primary Technical Match First**: State the candidate's technical foundation and projects that directly match the target JD's domain (e.g., SQL, Python, dbt, and ELT pipeline projects for a Data Engineering role).
   - **Strict Entity Separation (No Chimera Synthesis)**: Never fuse an unrelated internship or work experience with personal projects into a single blended claim. If referencing an internship or role from a different domain (such as Software QA / System Integration Testing at NOAH Business Application), introduce it in a **separate sentence with an explicit transition** and describe it strictly within its own `scope_boundary`:
     > *Golden Pattern*: "My technical foundation centers on modern data engineering and pipeline development using SQL, Python, and dbt. Furthermore, from my internship at NOAH Business Application, I am also well-versed in quality assurance and UAT, testing enterprise software modules in System Integration Testing (SIT) environments and validating system components against strict business rules to prevent quality issues prior to release."
3. **Paragraph 3: Closing Statement & Forward-Looking Close (2-3 sentences)**
   - Concise closing statement connecting relevant certifications and engineering discipline to the company's priorities, followed by a clear invitation for a conversation. Zero pleading, zero generic flattery.

---

## Step-by-Step Procedure

### 1. Ingest Job Description & Context
- Read target job description, company mission, and product domain.
- Check `data/applications.csv` for `<app_id>`.

### 2. Draft Verbatim Content (Enforcing Entity Boundaries)
- Draft the 3-4 paragraph text using the candidate's authentic voice and verified facts.
- Verify every sentence against each entry's `domain` and `scope_boundary` in `data/candidate-profile.yaml` and `data/star-stories.md` to ensure zero cross-entity vocabulary contamination.
- Check word count: ensure it is strictly under 280 words.
- Run anti-hype check: eliminate words like `spearhead`, `leverage`, `seamless`, `cutting-edge`, `robust`, `harness`, `testament to`.

### 3. Mandatory Pre-Generation Plan Review Gate (Hard Stop)
Before touching any `.typ` file:
- Author an implementation plan artifact containing the complete 1:1 drafted cover letter text verbatim, along with an **Entity Attribution Audit** listing each referenced project/experience and its `domain` to confirm zero cross-work conflation.
- Set `RequestFeedback: true` in `write_to_file`.
- **Halt execution** and await explicit user approval. Do not populate templates or compile until approved.

### 4. Populate Typst Template
Once approved:
- Read `templates/cover-letter/clean-letter.typ`.
- Replace placeholders with the approved letter text and contact details.
- Ensure the parent directory `$HOME/Documents/pick-me-output/applications/<app_id>_<company_name>/` exists.
- Save to `$HOME/Documents/pick-me-output/applications/<app_id>_<company_name>/cover_letter_<company_name>.typ`.

### 5. Compile to PDF via PowerShell
Compile using the compilation script:
```powershell
powershell -ExecutionPolicy Bypass -File "skills/typst-pdf/scripts/compile.ps1" -TypstFile "$HOME/Documents/pick-me-output/applications/<app_id>_<company_name>/cover_letter_<company_name>.typ" -OutputFile "$HOME/Documents/pick-me-output/applications/<app_id>_<company_name>/cover_letter_<company_name>.pdf"
```
Verify the resulting PDF exists and has a non-zero byte size.

### 6. Pipeline Follow-Up
Remind the user to record this application in `data/applications.csv`.

---

## Strict Constraints
- Anti-Hallucination & Entity Isolation: Zero fabrication of claims, tools, employers, or metrics, and zero blending of unrelated experiences/projects into composite claims.
- Length: Strictly 3 to 4 paragraphs maximum, under 280 words total.
- Strict zero emojis across all code, Typst files, and messages.

