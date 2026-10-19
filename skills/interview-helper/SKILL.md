---
name: interview-helper
description: Interactive human-in-the-loop interview coach that extracts authentic candidate stories and crafts personalized 1:1 STAR responses.
---

# Skill: interview-helper

## Overview
This skill prepares candidates for technical screenings, behavioral rounds, and architectural discussions. It uses an interactive human-in-the-loop approach: pulling out real candidate anecdotes from `data/star-stories.md` and `data/candidate-profile.yaml`, shaping them into structured STAR responses (Situation, Task, Action, Result), and generating high-signal reverse questions.

---

## Operating Modes

### Mode 1: Interactive Anecdote Extraction & Prep Brief
1. **Grounded Story Retrieval (With Strict Entity Isolation)**:
   - Inspect `data/candidate-profile.yaml` and `data/star-stories.md`, respecting each story's `Domain` and `Scope Boundary`.
   - Match target job competencies (e.g., technical debt, production outage, ambiguous specs) against existing stories without merging actions, tools, or outcomes from two different projects or employers into one story.
2. **Interactive Clarification**:
   - If a competency lacks a rich anecdote, ask the user targeted questions directly in chat:
     - *"What is a real time at [Company] where an architectural choice had unexpected trade-offs?"*
     - *"How did you handle the friction between product deadlines and technical debt in that sprint?"*
     - *"What concrete metric or outcome proved the solution worked?"*
3. **Formulate Authentic STAR Talking Points**:
   - **Situation**: Context in 1-2 sharp sentences.
   - **Task**: The explicit challenge and ownership stake.
   - **Action**: The specific technical, algorithmic, and architectural actions taken within that single project/role.
   - **Result**: Quantifiable outcomes, metrics, or engineering retrospectives.
4. **Persist High-Value Anecdotes**:
   - With candidate confirmation, append newly surfaced anecdotes to `data/star-stories.md` including explicit `Domain` and `Scope Boundary` fields.

### Mode 2: Mock Interview Simulation
1. **Ingest Target Context**:
   - Read job description, candidate profile, and noted skill gaps for the specific company.
2. **Single-Question Simulation**:
   - Present one focused behavioral or technical question at a time.
   - Pause and wait for the candidate's authentic response.
3. **Rubric Evaluation**:
   - Grade the response against STAR dimensions:
     - **Situation**: Crisp and concise (1-2 sentences)?
     - **Task**: Personal ownership clear?
     - **Action**: Concrete technical steps and trade-offs detailed?
     - **Result**: Measurable impact, user feedback, or learning cited?
4. **Targeted Refinement**:
   - Highlight what worked well.
   - Point out missing dimensions and provide a refined variation using verified facts from that specific story only.

---

## Deliverables per Interview Round
1. **Top 5 Behavioral Questions & Talking Points**: Customized to company values and role level.
2. **Technical Deep-Dive Sheet**: Expected system design, concurrency, or framework questions with past examples.
3. **High-Signal Reverse Questions**: 4-5 thoughtful questions to evaluate team engineering culture and deployment cadence.

---

## Strict Constraints
- Never fabricate anecdotes, merge unrelated projects/employers into composite stories, or script buzzwords not reflecting the candidate's voice.
- Strictly zero emojis across all interview briefs, talking points, and questions.

