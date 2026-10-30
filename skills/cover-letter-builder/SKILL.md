---
name: cover-letter-builder
description: Crafts authentic, high-impact cover letters grounded strictly in candidate-profile.yaml without generic AI clichés.
---

# Cover Letter Builder

Drafts concise, targeted cover letters grounded strictly in `data/candidate-profile.yaml` and `data/star-stories.md`. Select only the few facts that make a clear case for this role; relevance and readability matter more than coverage.

## Narrative Structure
Target length: 3 short paragraphs (140–220 words total). Do not pad with filler.

1. **Paragraph 1: Direct Opening (1–2 sentences)**
   Name the target role and state one grounded reason for relevance using the strongest matching background fact. Avoid generic openings (e.g., "I am writing to express my enthusiasm").
2. **Paragraph 2: Evidence of Fit (2–4 sentences)**
   Synthesize 1–2 relevant projects or outcomes from `star-stories.md` into natural conversational prose rather than pasting rigid resume bullets or raw STAR blocks verbatim. Skip implementation minutiae. If referencing an unrelated role alongside target-domain projects, attribute them in separate sentences respecting each entry's `domain` and `scope_boundary`.
3. **Paragraph 3: Clean Close (1–2 sentences)**
   Invite a conversation about the role and thank the reader. Do not recap skills, repeat certifications, or make unsupported claims about employer workflows.

## Procedure

### 1. Ingest Context & Identify Application ID
- Ingest the target job description and company domain.
- Check `data/applications.csv` for `<app_id>`.
- **Unified Package Protocol**: When tailoring both a resume and cover letter for the same role, share the single reserved `<app_id>` in `data/applications.csv`, present both verbatim drafts inside one consolidated implementation plan (`RequestFeedback: true`), and compile both PDFs into `~/Documents/pick-me-output/applications/<app_id>_<company>/` upon approval.

### 2. Mandatory Pre-Generation Plan Review Gate
Author an implementation plan artifact before touching any `.typ` file:
- Full verbatim cover letter text (140–220 words).
- **Entity Attribution Audit**: A table listing each referenced project or experience, its `domain`, and confirmation of zero cross-entity conflation.
- Set `RequestFeedback: true` and halt execution for user approval.

### 3. Generate & Compile
Once approved:
1. Populate `templates/cover-letter/clean-letter.typ` with approved text and contact details, ensuring `#set par(justify: true)` is set.
2. Resolve user's Documents folder (e.g. `C:\Users\<user>\Documents\pick-me-output\applications\<app_id>_<company>/`). Do NOT pass unresolved shell `$HOME` or `~` string literals into file-writing tools.
3. Save `.typ` to `~/Documents/pick-me-output/applications/<app_id>_<company>/cover_letter_<company>.typ`.
4. Compile to PDF using the repo compilation script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\compile.ps1 -TypstFile "<path/to/cover_letter.typ>" -AppFolder "<app_id>_<company>"
   ```
   (Note: `scripts/compile.ps1` includes an auto-relocation guard that moves any file inadvertently staged in the repository root to `~/Documents/pick-me-output/applications/<app_id>_<company>/` before compiling).
5. Verify the output PDF exists and has non-zero bytes.
6. Provide post-generation guidance to the user:
   - **For minor edits** (e.g., adjusting a sentence, swapping words, fixing recipient details): Prompt the user to run `powershell -ExecutionPolicy Bypass -File .\scripts\studio.ps1` to launch Pick Me Studio for zero-token visual editing, live preview, and instant PDF compilation.
   - **For major changes** (e.g., tailoring for a different job description, changing core narrative themes, major rewrites): Prompt the user to ask the assistant directly to draft a new implementation plan with proper entity isolation.
   - Prompt the user to log or update the application record in `data/applications.csv`.

## Constraints
- **Entity Isolation & Anti-Hallucination**: Zero fabrication of claims, tools, methodologies, or metrics. Never combine unrelated experiences or transfer vocabulary across domains.
- **Editorial Judgment**: Evaluate every sentence as a practicing engineer. Cut self-evaluative praise (claiming rigor, agility, or passion instead of showing work), abstract filler, and stiff corporate transitions; keep only concrete claims backed by verified work.
- **Zero Emojis**: Strictly prohibited across code, Typst files, and messages.
