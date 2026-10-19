---
name: get-to-know-me
description: Candidate onboarding and discovery skill. Extracts authentic career facts, projects, skills, and STAR stories via existing resume import or interactive interview to populate candidate-profile.yaml and star-stories.md. Use when the user wants to onboard, set up their profile, import a resume, or be interviewed before applying for jobs.
---

# Candidate Onboarding & Discovery (`get-to-know-me`)

## Overview
This skill establishes the candidate's authentic Source of Truth before any resume tailoring, cover letter drafting, or job applications begin. It populates:
1. `data/candidate-profile.yaml` (Factual work history, verified skills, projects, and target preferences).
2. `data/star-stories.md` (Rich anecdotes for behavioral interview rounds).

---

## Onboarding Entry Paths

When initiating onboarding, ask the candidate which path they prefer:

### Path A: Import Existing Resume (Recommended Fast-Track)
Best when the candidate already has an existing resume (PDF, Word, Markdown, or raw text).

1. **Obtain Resume**:
   - Ask the candidate to provide a local file path (e.g. `C:\path\to\resume.pdf` or `docs/resume.md`) or paste the plain text directly into chat.
2. **Ingest & Parse**:
   - If a file path is provided:
     - For `.txt` or `.md`: Read directly via `view_file`.
     - For `.pdf`: Use `view_file` or extract text using PowerShell.
   - Extract:
     - Full Name, Title, Contact Info, Links (GitHub, LinkedIn, Portfolio).
     - Work Experience (Companies, Titles, Start/End Dates, Bullet Points, Technologies).
     - Projects (Names, Descriptions, Tech Stacks, URLs).
     - Education (Degrees, Institutions, Graduation Years).
     - Categorized Skills (Languages, Frameworks, Tools, Methodologies).
3. **Populate Candidate Profile**:
   - Write the extracted information cleanly into `data/candidate-profile.yaml`, including `preferences.seniority_level` (e.g., `Entry-Level / Junior`, `Mid-Level`, `Senior`, `Staff / Lead`), `preferences.years_of_experience`, and explicit `domain` / `scope_boundary` fields on each experience entry so unrelated roles are never conflated during tailoring.
4. **Transition to Targeted Enrichment**:
   - Proceed to the Targeted Enrichment & STAR Mining section below.

---

### Path B: Zero-to-One Conversational Interview
Best when the candidate is starting fresh or making a career pivot without an existing resume.

Run the interview across 4 bite-sized conversational phases (one phase at a time):

#### Phase 1: Identity & Target Horizon
- What is your full name, location, and preferred contact details?
- What is your current seniority band and total years of experience (e.g., Entry-Level / Junior 0-2 yrs, Mid-Level 2-5 yrs, Senior 5+ yrs)?
- What specific job titles/roles are you targeting (e.g., Junior Data Engineer, Senior Full-Stack Engineer, AI Solutions Engineer)?
- What is your preferred work arrangement (Remote, Hybrid, Onsite) and prioritized locations (`locations_preferred`, ordered from highest priority to broadest)?
- What are your compensation / salary expectations?

#### Phase 2: Technical Arsenal & Specializations
- What are your top 3-4 languages and frameworks that you are most confident building with in production?
- What databases, cloud infrastructure, and DevOps tools do you use regularly?
- What engineering methodologies or architectures do you practice (e.g. TDD, Component-Driven Design, REST/GraphQL API design)?

#### Phase 3: Career History & Concrete Impact
For each recent company or key role:
- Company name, role title, timeframe, and primary `domain` (e.g., Software QA/SIT, Full-Stack Web, Data Engineering).
- What were the 2-3 most critical systems or tasks you worked on, and what is the strict `scope_boundary` of that role (to prevent mixing it with unrelated personal projects)?
- What measurable impact resulted from your work (e.g., users served, latency reduced, revenue generated, tests automated)?

#### Phase 4: Standout Projects
- Do you have 1-2 personal, client, or open-source projects that highlight your architectural strengths?
- What `domain` do they belong to, what problem did they solve, and what technologies did you choose?

---

## Targeted Enrichment & STAR Story Mining

Regardless of whether Path A or Path B was used, run this final high-value phase to ensure interview readiness:

### 1. Metric Sharpening
- Inspect bullets in `data/candidate-profile.yaml`.
- For any bullet points lacking concrete scale or impact (e.g. "improved application performance"), ask the candidate:
  - *"In this project at [Company], roughly what was the scale or measurable improvement (e.g. reduced latency from X to Y, percentage increase in throughput)?"*
- Update the bullet in `candidate-profile.yaml`.

### 2. Behavioral STAR Story Mining
Ask the candidate for 2 real career anecdotes to populate `data/star-stories.md`:
1. **The Production Incident / High-Stakes Bug**:
   - *"Tell me about a time something broke in production or a critical technical challenge surfaced under a tight deadline. What was the situation, your specific technical action, and the outcome?"*
2. **The Engineering Trade-off or Disagreement**:
   - *"Tell me about a time you had a technical disagreement with a teammate, tech lead, or product manager. How did you handle the trade-off and what was the resolution?"*
3. **The Ambiguous 0-to-1 Build**:
   - *"Tell me about a project where requirements were vague or rapidly shifting. How did you define the path forward and deliver?"*

Format each story into clean STAR markdown (Situation, Task, Action, Result) and append to `data/star-stories.md`.

---

## Output Validation Checklist

Before concluding onboarding:
1. Verify `data/candidate-profile.yaml` is valid YAML and free of empty placeholder tokens (`NAME_PLACEHOLDER`, etc.).
2. Verify `data/star-stories.md` contains at least 2 real STAR stories.
3. Inform the candidate that their Source of Truth is established, and they are now ready to:
   - Scout target roles via `job-posting-crawler`.
   - Tailor ATS resumes via `resume-builder`.
   - Draft authentic cover letters via `cover-letter-builder`.

---

## Strict Constraints
- Never invent facts or embellish details during import or interview.
- Strictly zero emojis across all interview questions, YAML data, and responses.
