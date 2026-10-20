# Pick Me.

An Antigravity plugin for job application asisstance that compiles ATS-compliant Typst resumes, writes targeted cover letters, crawls job postings,  prepares STAR interview answers, and tracks application pipelines in CSV.

All generated documents are compiled to PDF and stored in `~/Documents/pick-me-output/` for clean organization.

## Architecture

| Component | Type | Responsibility |
| :--- | :--- | :--- |
| **`job-posting-crawler`** | Subagent | Discovers and live-verifies job postings across ATS boards (Greenhouse, Lever, Ashby) and job portals with a 3-day freshness filter and a 100-point experience-first rubric. |
| **`resume-builder`** | Inline Skill | Tailors single-column Typst resumes to job descriptions. Enforces entity boundaries between past roles, requires a pre-generation plan approval, and compiles to PDF. |
| **`cover-letter-builder`** | Inline Skill | Drafts 3-paragraph (140–220 words) cover letters grounded in verified profile facts. Decouples unrelated technical domains with clean narrative transitions. |
| **`interview-helper`** | Inline Skill | Mines candidate stories from profile data into STAR talking points and conducts single-question mock interview simulations. |
| **`application-tracker`** | Inline Skill | Manages application lifecycles and follow-up schedules in RFC 4180 CSV (`data/applications.csv`). |
| **`well-being-coach`** | Inline Skill | Guides sustainable pacing (2–3 tailored applications per day) and de-personalizes automated rejections. |
| **`get-to-know-me`** | Inline Skill | Onboards candidates via existing resume import or a 4-phase conversational interview to populate profile facts and STAR stories. |
| **`typst-pdf`** | Inline Skill | Compiles `.typ` source files into PDFs via PowerShell. |

## Prerequisites

- [Google Antigravity](https://github.com/google-deepmind)
- PowerShell 7+ or Windows PowerShell
- [Typst CLI](https://typst.app/):
  ```powershell
  winget install --id Typst.Typst
  ```

## Installation

Install via the Antigravity CLI:

```powershell
agy plugin install https://github.com/auxghlann/pick-me
```

Or install from a local clone:

```powershell
git clone https://github.com/auxghlann/pick-me.git
cd pick-me
agy plugin install .
```

## Quickstart

### 1. Initialize Candidate Profile
Create candidate data files from templates:

```powershell
.\scripts\init-profile.ps1
```

This creates:
- `data/candidate-profile.yaml`: Master work history, skills, target preferences, and explicit `domain` / `scope_boundary` attributes.
- `data/star-stories.md`: Behavioral interview anecdotes structured into Situation, Task, Action, and Result.
- `data/applications.csv`: RFC 4180 pipeline tracker.

Alternatively, run `/get-to-know-me` in Antigravity to import an existing resume (`.pdf`, `.md`, `.txt`) or complete guided onboarding.

### 2. Tailor a Resume
Prompt Antigravity with a target job description:

```text
Tailor my resume for this role: [paste JD]
```

`resume-builder` will draft a plan artifact with inline source attribution tags (`[Source: ... | Domain: ...]`), request your approval, and compile the resume to `~/Documents/pick-me-output/applications/<app_id>_<company>/resume_<company>.pdf`.

### 3. Draft a Cover Letter
Prompt Antigravity:

```text
Draft a cover letter for this job: [paste JD]
```

`cover-letter-builder` drafts a 3-paragraph letter (140–220 words) with an entity attribution audit, awaits approval, and compiles to `~/Documents/pick-me-output/applications/<app_id>_<company>/cover_letter_<company>.pdf`.

### 4. Search & Verify Opportunities
Launch the crawler subagent:

```text
Find active Junior Data Engineer jobs in Manila or Remote posted in the last 3 days
```

`job-posting-crawler` verifies URL accessibility and score-ranks matching postings.

### 5. Track Applications
Update or inspect application records:

```text
Update APP-003 status to Screening
```

`application-tracker` computes weekly velocity and alerts when follow-up dates (+7 to +14 days) arrive.

## Data Privacy & Output Layout

All candidate files in `data/` (`candidate-profile.yaml`, `star-stories.md`, `applications.csv`) are git-ignored. Generated outputs are written to your local documents directory:

```text
~/Documents/pick-me-output/
├── applications/
│   └── <app_id>_<company>/
│       ├── resume_<company>.typ
│       ├── resume_<company>.pdf
│       ├── cover_letter_<company>.typ
│       └── cover_letter_<company>.pdf
└── crawls/
    └── crawl_<timestamp>.pdf
```
