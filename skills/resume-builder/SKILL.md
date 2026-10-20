---
name: resume-builder
description: Tailors an ATS-optimized single-column Typst resume from candidate-profile.yaml for a target job description and compiles it to PDF.
---

# Resume Builder

Tailors a concise, ATS-compliant single-column Typst resume grounded strictly in `data/candidate-profile.yaml` and `data/star-stories.md`.

## Content Selection & Entity Isolation

Select verified facts matching the target job description (JD) while treating each `experience[]` and `projects[]` entry as a sealed container:
- **Summary**: 1–2 concise sentences or omit. Focus on the target role and strongest matching qualifications. Keep unrelated work or internships cleanly separated with distinct transitions.
- **Skills**: Include verified skills relevant to the JD, prioritizing requested technologies. Never add unverified skills.
- **Work Experience**: Select 2–4 strong highlights per role. Each bullet communicates a distinct responsibility or verified outcome in plain language. Mirror JD terminology strictly within that role's own `domain` and `scope_boundary`. Never graft project keywords (e.g., `dbt`, pipelines) onto unrelated roles (e.g., QA/SIT).
- **Projects**: Select 1–2 projects that directly demonstrate technical depth relevant to the JD.
- **Skill Gaps**: Note missing required technologies in the review plan only; do not add a gap section to the resume.

## Procedure

### 1. Ingest Context & Identify Application ID
- Ingest the target JD and identify `<app_id>` from `data/applications.csv`.

### 2. Mandatory Pre-Generation Plan Review Gate
Author an implementation plan artifact before creating or editing any `.typ` file:
- Verbatim Professional Summary with inline `[Source: <entity_name> | Domain: <domain>]` audit tags confirming zero cross-work conflation.
- Verbatim ordered Technical Skills.
- Verbatim Experience bullets with `[Source: experience/<company> | Domain: <domain>]`.
- Verbatim Project bullets with `[Source: project/<name> | Domain: <domain>]`.
- Identified skill gaps and selection rationale.
- Set `RequestFeedback: true` and halt execution for user approval.

### 3. Generate & Compile
Once approved:
1. Populate `templates/resume/modern-clean.typ` with approved content and contact details.
2. Save to `$HOME/Documents/pick-me-output/applications/<app_id>_<company>/resume_<company>.typ`.
3. Compile to PDF:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "skills/typst-pdf/scripts/compile.ps1" -TypstFile "$HOME/Documents/pick-me-output/applications/<app_id>_<company>/resume_<company>.typ" -OutputFile "$HOME/Documents/pick-me-output/applications/<app_id>_<company>/resume_<company>.pdf"
   ```
4. Verify the output PDF exists and has non-zero bytes.
5. Prompt the user to log the application in `data/applications.csv`.

## Constraints
- **Anti-Hallucination & Entity Isolation**: Zero fabrication of metrics, skills, employers, or dates. Zero vocabulary borrowing across unrelated domains.
- **Layout**: Single-column, parser-friendly Typst formatting.
- **Zero Emojis**: Strictly prohibited across code, Typst files, and messages.
