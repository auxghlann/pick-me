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
   Highlight 1–2 relevant skills, projects, or outcomes without narrating implementation minutiae. If referencing an unrelated role alongside target-domain projects, attribute them in separate sentences respecting each entry's `domain` and `scope_boundary`.
3. **Paragraph 3: Clean Close (1–2 sentences)**
   Invite a conversation about the role and thank the reader. Do not recap skills, repeat certifications, or make unsupported claims about employer workflows.

## Procedure

### 1. Ingest Context & Identify Application ID
- Ingest the target job description and company domain.
- Check `data/applications.csv` for `<app_id>`.

### 2. Mandatory Pre-Generation Plan Review Gate
Author an implementation plan artifact before touching any `.typ` file:
- Full verbatim cover letter text (140–220 words).
- **Entity Attribution Audit**: A table listing each referenced project or experience, its `domain`, and confirmation of zero cross-entity conflation.
- Set `RequestFeedback: true` and halt execution for user approval.

### 3. Generate & Compile
Once approved:
1. Populate `templates/cover-letter/clean-letter.typ` with approved text and contact details, ensuring `#set par(justify: true)` is set.
2. Save to `$HOME/Documents/pick-me-output/applications/<app_id>_<company>/cover_letter_<company>.typ`.
3. Compile to PDF:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "skills/typst-pdf/scripts/compile.ps1" -TypstFile "$HOME/Documents/pick-me-output/applications/<app_id>_<company>/cover_letter_<company>.typ" -OutputFile "$HOME/Documents/pick-me-output/applications/<app_id>_<company>/cover_letter_<company>.pdf"
   ```
4. Verify the output PDF exists and has non-zero bytes.
5. Provide post-generation guidance to the user:
   - **For minor edits** (e.g., adjusting a sentence, swapping words, fixing recipient details): Prompt the user to run `powershell -ExecutionPolicy Bypass -File .\scripts\studio.ps1` to launch Pick Me Studio for zero-token visual editing, live preview, and instant PDF compilation.
   - **For major changes** (e.g., tailoring for a different job description, changing core narrative themes, major rewrites): Prompt the user to ask the assistant directly to draft a new implementation plan with proper entity isolation.
   - Prompt the user to log or update the application record in `data/applications.csv`.

## Constraints
- **Entity Isolation & Anti-Hallucination**: Zero fabrication of claims, tools, or metrics. Never combine unrelated experiences or transfer vocabulary across domains.
- **Anti-Hype**: Eliminate buzzwords (`spearhead`, `leverage`, `seamless`, `cutting-edge`, `robust`, `harness`, `testament to`).
- **Zero Emojis**: Strictly prohibited across code, Typst files, and messages.
