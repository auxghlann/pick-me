---
name: get-to-know-me
description: Candidate onboarding and discovery skill. Extracts authentic career facts, projects, skills, and STAR stories via existing resume import or interactive interview to populate candidate-profile.yaml and star-stories.md. Use when the user wants to onboard, set up their profile, import a resume, or be interviewed before applying for jobs.
---

# Candidate Onboarding & Discovery

Populates the candidate Source of Truth in `data/candidate-profile.yaml` and `data/star-stories.md`.

## Onboarding Paths

Ask the candidate which path they prefer:

### Path A: Import Existing Resume
1. Ingest candidate's resume from a local file path (`.pdf`, `.md`, `.txt`) or plain text.
2. Extract:
   - Contact details and profile links (GitHub, LinkedIn, Portfolio).
   - Work experience: companies, roles, dates, bullets, tools, plus explicit `domain` and `scope_boundary` fields.
   - Projects: names, descriptions, tech stacks, links, and `domain`.
   - Education: degrees, institutions, graduation dates.
   - Skills: categorized by language, framework, tool, and methodology.
   - Preferences: `seniority_level`, `years_of_experience`, `locations_preferred`, and `work_type`.
3. Write to `data/candidate-profile.yaml`, then proceed to Targeted Enrichment.

### Path B: Conversational Interview
Conduct across 4 sequential phases:
1. **Target Horizon**: Name, location, contact, target roles, seniority level, work arrangement, prioritized locations, and compensation expectations.
2. **Technical Arsenal**: Core languages, frameworks, databases, cloud infrastructure, DevOps, and engineering methodologies.
3. **Career History**: For each role: company, title, dates, primary `domain`, strict `scope_boundary`, key tasks, and measurable outcomes.
4. **Standout Projects**: 1–2 projects, their `domain`, problem solved, architecture, and tech stack.

## Targeted Enrichment & STAR Mining

1. **Metric Sharpening**: Inspect bullets in `data/candidate-profile.yaml`. Ask for concrete scale or metrics (latency, throughput, percentages) for any vague achievements and update them.
2. **STAR Story Mining**: Extract at least 2 authentic career anecdotes (e.g., production incident, architectural trade-off, or ambiguous 0-to-1 build). Format into Situation, Task, Action, and Result with explicit `Domain` and `Scope Boundary`, and append to `data/star-stories.md`.

## Validation & Constraints
- Verify `data/candidate-profile.yaml` is valid YAML with no empty placeholders.
- Verify `data/star-stories.md` contains at least 2 complete STAR stories.
- Never invent facts or embellish details.
- Strictly zero emojis across questions, data files, and responses.
