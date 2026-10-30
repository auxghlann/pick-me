# Phase 3: Subagent Tool Alignment & Unified Application Package Skills Implementation Plan

> **For agentic workers:** Execute this plan task-by-task using TDD and continuous execution ("Rulings, Not Stalls"). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `job-posting-crawler` frontmatter tool declarations with current Antigravity native tool names and codify the Unified Application Package procedure in `resume-builder` and `cover-letter-builder` so combined requests reserve one `App_ID` and present one consolidated review plan.  
**Architecture:** Updates the declarative YAML frontmatter in `agents/job-posting-crawler.md` and adds a synchronized **Unified Package Protocol** instruction to `skills/resume-builder/SKILL.md` and `skills/cover-letter-builder/SKILL.md` matching Rule 7 of `rules/AGENTS.md`.  
**Tech Stack:** Markdown, YAML frontmatter, Node.js `node:test`.  

## Global Constraints
- Follow `concise-skill-builder` guidelines: direct imperative instructions, zero filler, zero duplication.
- Strictly zero emojis across all skill and agent markdown files.
- Never run `git commit` without explicit user confirmation.

## Review Focus
1. **Crawler File Tool Availability**: `agents/job-posting-crawler.md` YAML frontmatter must include `read_file`, `write_file`, and `edit_file` so the subagent can read `data/candidate-profile.yaml` and `data/applications.csv` and write crawl digests without permission errors.
2. **Single `App_ID` Reservation on Combined Requests**: When a user asks to tailor both a resume and cover letter for the same job posting, `resume-builder` and `cover-letter-builder` must reserve a single sequential `App_ID` and write both `.typ` and `.pdf` files into the same `~/Documents/pick-me-output/applications/<app_id>_<company>/` directory.
3. **Single Review Gate Plan**: Combined requests must present both verbatim drafts (Resume + Cover Letter) inside one `implementation_plan.md` artifact (`RequestFeedback: true`) rather than halting twice.

---

### Task 1: Align `job-posting-crawler` Tool Names & Codify Unified Application Packages in Builder Skills

**Files:**
- Modify: `agents/job-posting-crawler.md:4-16, 141`
- Modify: `skills/resume-builder/SKILL.md:21-24`
- Modify: `skills/cover-letter-builder/SKILL.md:22-26`
- Test: `tests/unit/studio.test.js`

**Interfaces:**
- Consumes: `agents/job-posting-crawler.md`, `skills/resume-builder/SKILL.md`, `skills/cover-letter-builder/SKILL.md`.
- Produces:
  - Updated `tools:` YAML list in `agents/job-posting-crawler.md` containing `read_file`, `write_file`, and `edit_file`.
  - Explicit **Unified Package Protocol** directive in `skills/resume-builder/SKILL.md` and `skills/cover-letter-builder/SKILL.md`.

- [x] **Step 1: Write the failing test**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Update `agents/job-posting-crawler.md`, `skills/resume-builder/SKILL.md`, and `skills/cover-letter-builder/SKILL.md`**
- [x] **Step 4: Run test to verify it passes**

