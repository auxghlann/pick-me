---
name: resume-builder
description: Tailors an ATS-optimized single-column Typst resume from candidate-profile.yaml for a target job description and compiles it to PDF.
---

# Resume Builder

Tailors a concise, ATS-compliant single-column Typst resume grounded strictly in `data/candidate-profile.yaml` and `data/star-stories.md`.

## Content Selection & Entity Isolation

Select verified facts matching the target job description (JD) while treating each `experience[]` and `projects[]` entry as a sealed container:
- **Summary**: 1–2 concise sentences or omit. Focus on the target role and strongest matching qualifications. Keep unrelated work or internships cleanly separated with distinct transitions.
- **Skills**: Include only verified skills and methodologies recorded in `data/candidate-profile.yaml`, prioritizing requested technologies. Never add unverified skills or infer methodologies solely because the JD requests them.
- **Work Experience**: Select 2–4 strong highlights per role. Structure bullets in engineering chronology (*Problem/Context -> Technical Implementation -> Verified Outcome*). Mirror JD terminology strictly within that role's own `domain` and `scope_boundary`; never graft project keywords onto unrelated roles. Omit self-congratulatory adjectives and generic corporate purpose clauses.
- **Projects**: Select 1–2 projects that directly demonstrate technical depth relevant to the JD, structured in engineering chronology (*Problem/Context -> Technical Implementation -> Verified Outcome*).
- **Skill Gaps**: Note missing required technologies in the review plan only; do not add a gap section to the resume.

## Procedure

### 1. Ingest Context & Identify Application ID
- Ingest the target JD and identify `<app_id>` from `data/applications.csv`.
- **Unified Package Protocol**: When tailoring both a resume and cover letter for the same role, reserve a single sequential `<app_id>` in `data/applications.csv`, draft both documents inside one consolidated implementation plan (`RequestFeedback: true`), and compile both PDFs into `~/Documents/pick-me-output/applications/<app_id>_<company>/` upon approval.

### 2. Mandatory Pre-Generation Plan Review Gate
Author an implementation plan artifact before creating or editing any `.typ` file:
- Verbatim Professional Summary with inline `[Source: <entity_name> | Domain: <domain>]` audit tags confirming zero cross-work conflation.
- Verbatim ordered Technical Skills, verified 1:1 against `data/candidate-profile.yaml` (confirming zero assumed methodologies).
- Verbatim Experience and Project bullets with `[Source: <entity> | Domain: <domain>]`, audited with engineering judgment so every line reads as a direct technical statement rather than performative commentary or raw copy-pasted notes.
- Identified skill gaps and selection rationale.
- Set `RequestFeedback: true` and halt execution for user approval.

### 3. Generate & Compile
Once approved:
1. Populate `templates/resume/modern-clean.typ` with approved content and contact details.
2. Resolve user's Documents folder (e.g. `C:\Users\<user>\Documents\pick-me-output\applications\<app_id>_<company>/`). Do NOT pass unresolved shell `$HOME` or `~` string literals into file-writing tools.
3. Save `.typ` to `~/Documents/pick-me-output/applications/<app_id>_<company>/resume_<company>.typ`.
4. Compile to PDF using the repo compilation script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\compile.ps1 -TypstFile "<path/to/resume.typ>" -AppFolder "<app_id>_<company>"
   ```
   (Note: `scripts/compile.ps1` includes an auto-relocation guard that moves any file inadvertently staged in the repository root to `~/Documents/pick-me-output/applications/<app_id>_<company>/` before compiling).
5. Verify the output PDF exists and has non-zero bytes.
6. Provide post-generation guidance to the user:
   - **For minor edits** (e.g., word tweaks, phrasing, contact updates, fixing typos): Prompt the user to run `powershell -ExecutionPolicy Bypass -File .\scripts\studio.ps1` to launch Pick Me Studio for zero-token visual form editing, live preview, and instant PDF compilation.
   - **For major changes** (e.g., tailoring for a different job description, restructuring sections, adding new roles or STAR stories): Prompt the user to ask the assistant directly to draft an updated plan with verified entity isolation and factual grounding.
   - Prompt the user to log or update the application record in `data/applications.csv`.

## Constraints
- **Anti-Hallucination & Entity Isolation**: Zero fabrication of metrics, skills, methodologies, employers, or dates. Zero vocabulary borrowing across unrelated domains.
- **Editorial Judgment**: Evaluate every bullet as a practicing engineer. Cut self-evaluative praise, filler adverbs, and generic corporate justification clauses.
- **Layout**: Single-column, parser-friendly Typst formatting.
- **Zero Emojis**: Strictly prohibited across code, Typst files, and messages.
