# Authentic Resume Grounding & Agentic Tone Implementation Plan

> **For agentic workers:** Execute this plan task-by-task using TDD and continuous execution ("Rulings, Not Stalls"). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scrub personal PII and unverified methodologies from `scripts/studio.ps1` template previews, and replace static buzzword blacklists in `resume-builder` and `cover-letter-builder` with agentic editorial judgment, engineering chronology, and strict methodology grounding.  
**Architecture:** Remove brittle regex phrase blacklists and unnecessary external linter scripts in favor of semantic agent evaluation during the existing Mandatory Pre-Generation Plan Review Gate (`RequestFeedback: true`). Neutralize hardcoded candidate PII in `scripts/studio.ps1` so the public repository complies with `AGENTS.md` Rule 4 (Privacy & Git Hygiene).  
**Tech Stack:** PowerShell 7+, Typst CLI, Markdown Skill Specifications (`concise-skill-builder`).  

## Global Constraints
- **Privacy & Git Hygiene**: Zero candidate PII (names, phone numbers, personal emails, universities, or GPAs) in tracked repository files (`scripts/studio.ps1`).
- **Strict Source Grounding**: Every technical skill and methodology (`Agile`, `Scrum`, `CI/CD`, etc.) on a generated resume must exist in `data/candidate-profile.yaml`.
- **Agentic Tone Over Static Lists**: Evaluate prose semantically using engineering judgment rather than brittle banned-word regex lists.
- **Zero Emojis**: Strictly zero emojis across all code, tests, templates, markdown files, and messages.

## Review Focus
1. `scripts/studio.ps1` template preview replacement must compile cleanly via Typst CLI (`modern-clean.typ` and `clean-letter.typ`) without unescaped `@` reference errors.
2. `scripts/studio.ps1` must contain zero personal candidate PII or unverified `"Agile"` defaults.
3. `skills/resume-builder/SKILL.md` must enforce engineering chronology (*Context -> Implementation -> Outcome*) and explicit methodology verification without duplicating existing project-count rules.
4. `skills/cover-letter-builder/SKILL.md` must replace the static buzzword list with agentic editorial criteria that prevent both performative AI clichés and stiff 1:1 STAR story copy-pasting.

---

### Task 1: Scrub PII & Unverified Defaults in `scripts/studio.ps1`

**Files:**
- Modify: `scripts/studio.ps1:373-390`
- Test: `tests/test-cover-letter.js`

**Interfaces:**
- Consumes: `templates/resume/modern-clean.typ` and `templates/cover-letter/clean-letter.typ` placeholders
- Produces: Neutral, privacy-compliant sample preview compilation in `scripts/studio.ps1`

- [x] **Step 1: Add regression assertion in `tests/test-cover-letter.js`**
  ```javascript
  const studioPs1 = fs.readFileSync(path.join(__dirname, "..", "scripts", "studio.ps1"), "utf8");
  assert(!studioPs1.includes("candidate-real-name"), "studio.ps1 must not contain personal candidate name");
  assert(!studioPs1.includes("personal-email@domain"), "studio.ps1 must not contain personal email");
  assert(!studioPs1.includes("+63 9XX XXX XXXX"), "studio.ps1 must not contain personal phone number");
  assert(!studioPs1.includes("METHODOLOGIES_PLACEHOLDER\", \"CI/CD, System Integration Testing (SIT), Agile\""), "studio.ps1 must not inject unverified Agile methodology");
  ```

- [x] **Step 2: Run test to verify it fails**
  Run: `node tests/test-cover-letter.js`
  Expected: FAIL with `AssertionError: studio.ps1 must not contain personal candidate name`

- [x] **Step 3: Replace hardcoded PII and defaults in `scripts/studio.ps1`**
  Update lines 375–389 in `scripts/studio.ps1` to use neutral placeholder sample data (`Alex Rivera`, `State University`, `alex.rivera@example.com`, `alex.rivera\@example.com`, `+1 555 019 2834`, `System Integration Testing (SIT), Automated Testing, CI/CD`).

- [x] **Step 4: Run test to verify it passes**
  Run: `node tests/test-cover-letter.js`
  Expected: PASS

---

### Task 2: Upgrade `skills/resume-builder/SKILL.md` with Agentic Judgment & Chronology

**Files:**
- Modify: `skills/resume-builder/SKILL.md:10-32`

**Interfaces:**
- Consumes: `data/candidate-profile.yaml`, `data/star-stories.md`
- Produces: Streamlined skill instructions enforcing engineering chronology, methodology grounding, and agentic anti-slop evaluation

- [x] **Step 1: Update `Content Selection & Entity Isolation` and `Mandatory Pre-Generation Plan Review Gate` in `skills/resume-builder/SKILL.md`**
  - Specify under **Skills**: Include only verified skills and methodologies recorded in `data/candidate-profile.yaml`; never infer methodologies (such as Agile or Scrum) solely because the job description requests them.
  - Specify under **Work Experience & Projects**: Structure bullets in engineering chronology (*Problem/Context -> Technical Implementation -> Verified Outcome*). Omit self-congratulatory adjectives and generic corporate purpose clauses (e.g., explaining why testing ensures quality).
  - Add an agentic tone check to the Step 2 Review Gate: verify that every bullet reads like a direct engineering statement rather than performative commentary or verbatim copy-pasted notes.

- [x] **Step 2: Verify conciseness and zero-emoji compliance**
  Inspect `skills/resume-builder/SKILL.md` to confirm adherence to `concise-skill-builder` rules.

---

### Task 3: Replace Static Buzzword List in `skills/cover-letter-builder/SKILL.md`

**Files:**
- Modify: `skills/cover-letter-builder/SKILL.md:10-49`

**Interfaces:**
- Consumes: `data/candidate-profile.yaml`, `data/star-stories.md`
- Produces: Agent-driven editorial judgment criteria replacing the static banned-word list

- [x] **Step 1: Update `Narrative Structure` and `Constraints` in `skills/cover-letter-builder/SKILL.md`**
  - In **Paragraph 2 (Evidence of Fit)**: Instruct the agent to synthesize outcomes from `star-stories.md` into natural conversational prose rather than pasting rigid resume bullets or raw STAR blocks verbatim.
  - In **Constraints (Anti-Hype)**: Replace the hardcoded buzzword list (`spearhead`, `leverage`, `seamless`, etc.) with agentic editorial judgment:
    > **Editorial Judgment**: Evaluate every sentence as a practicing engineer. Cut self-evaluative praise (claiming rigor, agility, or passion instead of showing work), abstract filler, and stiff corporate transitions; keep only concrete claims backed by verified work.

- [x] **Step 2: Run full verification suites**
  Run: `node tests/test-cover-letter.js`
  Expected: PASS

---

## Execution Principles: "Rulings, Not Stalls"
1. **Continuous Execution**: Do not pause between tasks to ask "should I continue?". Execute all tasks continuously once approved.
2. **Ledger Rulings**: If ambiguities or minor plan defects arise, make an authoritative engineering decision, record it in your plan notes as `Ruling: <what you decided> - <why> - <cost if wrong>`, and proceed.
3. **Hard Stops**: Stop execution only if encountering:
   - An irreversible or destructive operation.
   - A security-sensitive credential or authentication risk.
   - External side effects outside the workspace (pushing, publishing).
   - A plan so fundamentally broken that every forward path is a guess.
