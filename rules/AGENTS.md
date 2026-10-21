# Job Application Helper Directives (`job-application-helper/rules/AGENTS.md`)

## Domain Purpose
This plugin suite provides an end-to-end, human-grounded job application acceleration platform:
- ATS-optimized single-column Typst resumes compiled to PDF
- Authentic, non-generic cover letters
- Interactive human-in-the-loop interview coaching
- Automated Google search dorking and live opportunity verification
- Central pipeline tracking in `data/applications.csv`
- Mental health and burnout support for applicants navigating the job market

---

## Architectural Dispatch Model

To prevent $N \times M$ token duplication and context cold-starts, this suite follows a lean split between isolated subagents and inline skills:

### 1. Dedicated Subagent (Isolated Sandbox)
Heavy, noisy operations that generate large amounts of transient DOM and search tokens are strictly isolated in a dedicated subagent:

| Subagent | TypeName | Role & Mandate |
| :--- | :--- | :--- |
| **`job-posting-crawler`** | `job-posting-crawler` | Market scout and opportunity verifier. Dynamically calibrates to `candidate-profile.yaml`. Enforces 3-day freshness filter and live HTTP 200 verification gate. Prioritizes Years of Experience (40 pts) over Skills (25 pts), allows +1 yr stretch (15-20 pts), penalizes +2 yr deficit (-15 pts), and hard-excludes >= 3 yr deficits. Isolated in subagent to keep search and Playwright tokens out of the main chat context. |

### 2. Inline Skills (Zero Subagent Overhead & Memory Persistence)
Generative, coaching, and pipeline tracking workflows run directly in the active session as progressive, lazy-loaded skills. This preserves loaded candidate context in memory without duplicate file reads:

| Skill | Trigger / Use Case | Procedure & Artifacts |
| :--- | :--- | :--- |
| **`resume-builder`** | Tailoring an ATS resume for a target JD | `skills/resume-builder/SKILL.md`. Requires 1:1 drafted plan artifact (`RequestFeedback: true`) before populating `templates/resume/modern-clean.typ` and compiling via `typst-pdf`. |
| **`cover-letter-builder`** | Drafting a targeted, authentic cover letter | `skills/cover-letter-builder/SKILL.md`. 3-4 paragraphs (< 280 words, fully justified). Requires 1:1 plan artifact (`RequestFeedback: true`) before populating `templates/cover-letter/clean-letter.typ`. |
| **`application-tracker`** | Logging applications, status updates, metrics | `skills/application-tracker/SKILL.md`. RFC 4180 CSV compliance, 7-14 day follow-ups, and pipeline velocity tracking in `data/applications.csv`. |
| **`interview-helper`** | Behavioral & technical interview preparation | `skills/interview-helper/SKILL.md`. Human-in-the-loop STAR extraction from `star-stories.md` and mock interview simulations. |
| **`well-being-coach`** | Daily pacing, rejection fatigue, grounding | `skills/well-being-coach/SKILL.md`. Burnout prevention, 2-3 tailored applications/day pacing, and pre-interview calming. |
| **`get-to-know-me`** | Candidate onboarding and profile extraction | `skills/get-to-know-me/SKILL.md`. Extracts authentic profile facts and STAR stories from existing resumes or guided interview. |
| **`typst-pdf`** | Document compilation engine | `skills/typst-pdf/SKILL.md`. Generic Typst markup assembly and PDF compilation utility. |

---

## Domain Standards

1. **Binding Source of Truth & Strict Entity Isolation**:
   - All generative outputs (`resume-builder`, `cover-letter-builder`, `interview-helper`) are strictly anchored to `data/candidate-profile.yaml` and `data/star-stories.md`. Fabrication of employers, degrees, skills, or unverified metrics is strictly prohibited.
   - **Zero Cross-Entity Conflation (No Chimera Synthesis)**: Every entry in `experience[]`, `projects[]`, and `star-stories.md` is a sealed factual container governed by its `domain` and `scope_boundary`. Never combine two unrelated experiences or projects into a single blended claim, and never borrow vocabulary from one entry (e.g., Data Engineering `dbt` or transactional data integrity) to reframe an unrelated entry (e.g., Software QA / SIT application module testing).
   - **Explicit Transition Between Unrelated Domains**: When referencing both primary domain projects and an internship/role from a different domain in a summary or cover letter, separate them into distinct sentences with explicit source attribution (e.g., *"Furthermore, from my internship at [Company]..."*).
2. **Mandatory Review Plan Gate**: Before creating or modifying any `.typ` source file, author an implementation plan artifact containing the complete 1:1 drafted content verbatim—with inline `[Source: <entity_name> | Domain: <domain>]` verification tags confirming zero cross-entity conflation—and request user feedback (`RequestFeedback: true`).
3. **Universal CSV Tracking**: All pipeline events must be recorded directly in `data/applications.csv`.
4. **Clean Typst Formatting**: All resume outputs must follow single-column, parser-friendly Typst standards.
5. **Strict Zero Emojis**: Strictly zero emojis across all code, documents, Typst files, templates, and messages.
6. **Unified Application Packages**: When tailoring both a resume and cover letter for a target role, reserve the next `App_ID` in `data/applications.csv` first, draft both in a single plan artifact, and compile both PDFs upon approval.
7. **Post-Generation Editing Guidance**:
   - Upon completing any document generation (`resume-builder`, `cover-letter-builder`), explicitly remind the user:
     - For **minor edits** (e.g., word tweaks, phrasing adjustments, fixing typos, single-line updates): Run `powershell -ExecutionPolicy Bypass -File .\scripts\studio.ps1` to launch Pick Me Studio for zero-token visual editing, live preview, and instant PDF compilation.
     - For **major changes** (e.g., tailoring for a different job description, restructuring sections, adding new roles or STAR stories): Prompt the assistant directly to draft an updated plan with verified entity isolation and factual grounding.

