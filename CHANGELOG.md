# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.3.1] - 2026-10-27

### Fixed
- **Cover Letter Compile & Styling Drift (Issue #7)**: Preserved `#set page`, `#set text`, `#set par`, and document preamble during serialization in Pick Me Studio to prevent font and dimension reset to US Letter and default serif typography.
- **Multi-Sign-off Recognition**: Broadened cover letter parser to recognize diverse valedictions (`Sincerely,`, `Best Regards,`, `Respectfully,`, etc.), preventing unwarranted fallback to raw mode.
- **Form Input Sanitization**: Cleaned raw Typst formatting (`*...*`, trailing `\`, `#v(16pt)`) from recipient address and sign-off form fields.
- **Header Email Formatting**: Formatted candidate email to display the exact full address with escaped at-symbol (`khestermesa\@gmail.com`) rather than shortening to `@username`.
- **Studio Multi-File State Desync**: Synchronized textarea state during file loading and visual mode switches to eliminate stale document bleeding across file selections.

### Changed
- **Directives Compression**: Rewrote `rules/AGENTS.md` following `concise-skill-builder` principles, reducing line count by 36% while preserving all scoring weights, entity isolation, and review gates.
- **Local Verification Suite**: Added local gitignored Playwright E2E suite (`tests/e2e/studio.e2e.js`) and unit test suite (`tests/test-cover-letter.js`) under `tests/`.

## [v1.3.0] - 2026-10-22

### Added
- **Pick Me Studio**: Zero-token local visual web editor and live PDF recompiler (`scripts/studio.ps1` + `templates/studio/`).
  - Lightweight PowerShell HTTP server powered by `System.Net.Sockets.TcpListener` for unprivileged local execution without administrative rights or external dependencies.
  - Modular frontend architecture (`index.html`, `studio.css`, `studio.js`) with bidirectional form card parsing, raw Typst editor, and synchronized Typst PDF preview.
  - Draggable split-pane resizer with bounds clamping and pointer event shielding.
  - High-contrast dark and light mode theme toggle.
  - Robust drag-and-drop and file upload with dynamic dropdown updating.
  - Responsive single-row header and viewport layouts supporting mobile and desktop screens without control collisions.

### Changed
- **Builder Post-Generation Guidance**: Updated `resume-builder` and `cover-letter-builder` skills to guide applicants toward Pick Me Studio for minor wording adjustments while reserving LLM interaction for major tailoring revisions.
- **Documentation & Spec Context**: Documented the Studio workflow in `README.md` and established `.spec/plans/` for living task contracts.

## [v1.2.0] - 2026-10-20

### Changed
- **Skill Instructions Streamlining**: Refactored all 7 inline skills (`application-tracker`, `cover-letter-builder`, `get-to-know-me`, `interview-helper`, `resume-builder`, `typst-pdf`, `well-being-coach`) using `concise-skill-builder` principles, achieving a 46.6% line and token reduction while preserving all functional constraints, entity isolation rules, and review gates.
- **Documentation Overhaul**: Rewrote `README.md` following `saw-readme` guidelines to provide concise, hype-free developer documentation with accurate component architectures and runnable setup commands.
- **Manifest Cleanup**: Removed legacy root `plugin.json` to establish `.antigravity-plugin/plugin.json` as the single source of truth for plugin metadata.

## [v1.1.0] - 2026-10-19

### Added
- **MIT License**: Added official MIT license to root repository.
- **Entity & Domain Isolation Memory Management**:
  - Added `domain` and `scope_boundary` fields to `candidate-profile.template.yaml` and candidate profiles to prevent cross-entity conflation.
  - Implemented constitutional **Anti-Chimera & Strict Entity Isolation Laws** in `rules/AGENTS.md`.
  - Enforced inline `[Source: <entity_name> | Domain: <domain>]` verification tags in resume-builder and cover-letter-builder review plans (`RequestFeedback: true`).
  - Added strict domain boundary checks to `skills/interview-helper/SKILL.md` and `skills/get-to-know-me/SKILL.md`.

### Changed
- Refined cover letter and resume summary generation to explicitly decouple unrelated technical domains (e.g. Data Engineering projects vs. Software QA/SIT internships) using cleanly separated narrative transitions.

## [v1.0.0] - 2026-10-16

### Initial Stable Release: Pick Me - Autonomous Career & Job Application Suite

Pick Me is a specialized, human-grounded job application acceleration platform for Google Antigravity. It eliminates AI hallucinations, enforces ATS compliance, streamlines interview prep, protects applicant mental well-being, and keeps your repository clean by saving all documents directly to your local Documents folder.

### Core Architecture & Capabilities

#### 1. Anti-Hallucination Constitution (Binding Law)
- **Single Source of Truth**: All resumes, cover letters, and interview coaching are strictly anchored to `data/candidate-profile.yaml` and `data/star-stories.md`.
- **Zero Fabrication**: Strictly prohibits inventing past employers, degrees, unacquired skills, or unverified metrics.
- **Strict Zero Emojis**: Enforced across all code, Typst templates, markdown documents, and generated outputs.

#### 2. Market Scout Subagent (`job-posting-crawler`)
- **Automated Search Dorking**: Targets top ATS boards (Greenhouse, Lever, Ashby, Workable, SmartRecruiters) and regional portals (JobStreet, Kalibrr, LinkedIn).
- **Strict 3-Day Freshness Filter**: Discards any posting older than 72 hours to maximize early application velocity.
- **Live URL Verification Gate**: Validates HTTP 200 status and application form availability via `read_url_content` and Playwright MCP for client-rendered (CSR) and Cloudflare-protected corporate portals.
- **Dynamic 100-Point Rubric**:
  - **40 pts - Years of Experience & Seniority Calibration**: Exact match (35-40 pts), +1 yr slight stretch (15-20 pts), +2 yr deficit (-15 pt heavy penalty), and hard exclusion for >= 3 yr deficits.
  - **25 pts - Required Skill Match**: Core technical stack overlap.
  - **20 pts - Location & Work Arrangement**: Prioritized against candidate location hierarchy.
  - **15 pts - Credentials & Constraints**: Degree, certifications, salary expectations, and work authorization.
- **PDF Crawl Digest**: Exports verified opportunities to `~/Documents/pick-me-output/crawls/` using `templates/crawl-report/job-leads-digest.typ`.

#### 3. ATS Typst Resume Engine (`resume-builder`)
- **Single-Column Parser-Friendly Typst**: Beautiful, parser-compliant typography authored in Typst and compiled directly to PDF.
- **Google XYZ Bullets**: Structures all accomplishments into "Accomplished [X] as measured by [Y], by doing [Z]".
- **Mandatory Review Plan Gate (`RequestFeedback: true`)**: Halts execution to present the complete 1:1 drafted resume content for candidate review and approval before touching code or compiling.

#### 4. Authentic Cover Letter Engine (`cover-letter-builder`)
- **Compressed 3-4 Paragraph Narrative**: Kept strictly under 280 words with full Typst text justification (`justify: true`).
- **Anti-Hype & Anti-Slop Contract**: Strictly bans generic AI openings and buzzwords (`spearhead`, `leverage`, `seamless`, `cutting-edge`, `robust`, `harness`).
- **Direct Problem-Solving Hook**: Bridges authentic candidate engineering anecdotes with employer mission and technical challenges.
- **Mandatory Review Plan Gate**: Requires candidate approval of drafted letter text prior to compilation.

#### 5. Pipeline Management (`application-tracker`)
- **RFC 4180 CSV Compliance**: Centralized tracking in `data/applications.csv`.
- **Sequential IDs & Automatic Follow-Ups**: Assigns sequential IDs (`APP-001`, `APP-002`) and automatically schedules +7 to +14 day follow-up target dates.
- **Full Lifecycle Transitions**: Tracks statuses (`Drafted`, `Applied`, `Screening`, `Interviewing`, `Offer`, `Rejected`, `Ghosted`) and computes weekly velocity metrics.

#### 6. Interactive Interview Coach (`interview-helper`)
- **Human-in-the-Loop STAR Extraction**: Asks targeted probing questions to surface real candidate anecdotes and shape them into structured STAR talking points (Situation, Task, Action, Result).
- **Mock Interview Simulation**: Single-question pacing with rubric grading across Situation, Task, Action, and Result dimensions.
- **High-Signal Reverse Questions**: Custom reverse-interview questions to evaluate team engineering culture, deployment cadence, and technical debt.

#### 7. Mental Well-Being Companion (`well-being-coach`)
- **De-Personalizing Rejection**: Reframes automated ATS rejections without toxic positivity.
- **Sustainable Pacing**: Enforces healthy quotas of 2-3 tailored applications per day over demoralizing spray-and-pray blasting.
- **Pre-Interview Grounding**: Calming routines and perspective resets before technical calls.
- **Controllable Wins**: Celebrates effort and momentum using cumulative data from `applications.csv`.

#### 8. Candidate Onboarding (`get-to-know-me`)
- Interactive conversational onboarding or automated resume parser (PDF/DOCX/Markdown) that seeds `data/candidate-profile.yaml` and `data/star-stories.md`.

#### 9. Desktop Output Management
- All generated resumes, cover letters, and crawl digests are saved directly to `~/Documents/pick-me-output/`, keeping the source repository clean and all documents accessible in Windows Explorer.
