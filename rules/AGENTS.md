# Job Application Directives (`rules/AGENTS.md`)

## Dispatch Architecture

Isolate noisy search and DOM operations in a dedicated subagent; run generative, tracking, and coaching tasks inline to preserve candidate memory.

### Subagent

| Subagent | TypeName | Role & Mandate |
| :--- | :--- | :--- |
| **`job-posting-crawler`** | `job-posting-crawler` | Searches and verifies job postings against `candidate-profile.yaml`. Enforces 3-day freshness and live HTTP 200 gate. Prioritizes Years of Experience (40 pts) over Skills (25 pts), allows +1 yr stretch (15-20 pts), penalizes +2 yr deficit (-15 pts), and hard-excludes >= 3 yr deficits. |

### Inline Skills

| Skill | Trigger / Task | Procedure |
| :--- | :--- | :--- |
| **`resume-builder`** | Tailoring ATS resumes | `skills/resume-builder/SKILL.md`. Requires plan artifact (`RequestFeedback: true`) before populating `templates/resume/modern-clean.typ` and compiling via `scripts/compile.ps1`. |
| **`cover-letter-builder`** | Drafting targeted cover letters | `skills/cover-letter-builder/SKILL.md`. 3 short paragraphs (140–220 words, justified). Requires plan artifact (`RequestFeedback: true`) before populating `templates/cover-letter/clean-letter.typ` and compiling via `scripts/compile.ps1`. |
| **`application-tracker`** | Pipeline logging & metrics | `skills/application-tracker/SKILL.md`. RFC 4180 CSV tracking, 7-14 day follow-ups in `data/applications.csv`. |
| **`interview-helper`** | Interview preparation | `skills/interview-helper/SKILL.md`. Extracts STAR stories from `star-stories.md` and runs mock simulations. |
| **`well-being-coach`** | Burnout & pacing support | `skills/well-being-coach/SKILL.md`. Enforces 2-3 tailored applications/day pacing and pre-interview calming. |
| **`get-to-know-me`** | Candidate onboarding | `skills/get-to-know-me/SKILL.md`. Extracts profile facts and STAR stories from existing resumes or guided interview. |

## Core Rules

1. **Strict Source Grounding**: Anchor all generated resumes, cover letters, and interview coaching strictly to `data/candidate-profile.yaml` and `data/star-stories.md`. Never invent employers, degrees, skills, or metrics.
2. **Entity Isolation (No Chimera Synthesis)**: Treat each entry in `experience[]`, `projects[]`, and `star-stories.md` as an isolated container bounded by its `domain` and `scope_boundary`. Never combine unrelated experiences or borrow vocabulary across domains (e.g. framing software QA with data engineering terms). Separate cross-domain references into distinct sentences with explicit attribution.
3. **Mandatory Review Gate**: Before creating or editing `.typ` files, present an implementation plan (`RequestFeedback: true`) containing verbatim content with inline `[Source: <entity> | Domain: <domain>]` attribution tags.
4. **Universal Pipeline Tracking**: Record all application events and lifecycle statuses directly in `data/applications.csv`.
5. **Clean Typst Layout & Syntax Hygiene**: Format all resumes as single-column, parser-friendly Typst documents. In Typst markup, escape email `@` characters (`user\@domain.com` or `#link("mailto:...")`), escape double quotes inside string parameters (`\"`), and avoid unescaped math dollar signs (`\$`).
6. **External Output Delegation**: All generated `.typ` and `.pdf` files belong in `~/Documents/pick-me-output/applications/<app_id>_<company>/`—never inside the git repository. Compile using:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\compile.ps1 -TypstFile "<path/to/doc.typ>" -AppFolder "<app_id>_<company>"
   ```
   `scripts/compile.ps1` includes an automatic relocation guard that moves any repository-staged application file into `~/Documents/pick-me-output/applications/<app_id>_<company>/` before compiling.
7. **Unified Packages**: When tailoring both a resume and cover letter, reserve the next `App_ID` in `data/applications.csv`, draft both in one review plan, and compile both PDFs upon approval.
8. **Zero Emojis**: Do not use emojis in code, Typst files, documentation, commit messages, or responses.
9. **Post-Generation Editing Guidance**: Remind the user after compiling documents:
   - Minor edits: Run `powershell -ExecutionPolicy Bypass -File .\scripts\studio.ps1` to launch Pick Me Studio for zero-token visual editing and PDF recompilation.
   - Major changes: Prompt the assistant to draft a new plan with entity-isolated grounding.
