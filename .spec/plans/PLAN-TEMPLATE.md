# [Feature Name] Implementation Plan

> **For agentic workers:** Execute this plan task-by-task using TDD and continuous execution ("Rulings, Not Stalls"). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]  
**Architecture:** [2-3 sentences about approach and system boundaries]  
**Tech Stack:** [Key technologies, libraries, or scripts]  

## Global Constraints
[Project-wide requirements — version floors, dependency limits, naming conventions, platform requirements — one line each, with exact values. Every task's requirements implicitly include this section.]

## Review Focus
[Top 5 edge cases, input classes, or failure modes that could break in production — one line each, naming the input or condition and expected behavior. Every item listed here must have a corresponding verification step pinned to a task below.]

---

### Task 1: [Component Name]

**Files:**
- Create: `exact/path/to/file`
- Modify: `exact/path/to/existing:line_start-line_end`
- Test: `tests/exact/path/to/test`

**Interfaces:**
- Consumes: [Exact signatures/types used from earlier tasks or system]
- Produces: [Exact function names, parameters, and return types exposed for future tasks]

- [ ] **Step 1: Write the failing test**
  ```language
  // Concrete test asserting specific expected behavior with exact values
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `test runner command`
  Expected: FAIL with specific error message

- [ ] **Step 3: Implement minimal code in `exact/path/to/file`**
  [Exact function signature and approach]

- [ ] **Step 4: Run test to verify it passes**
  Run: `test runner command`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add <files>
  git commit -m "feat/fix: <description>"
  ```

---

## Execution Principles: "Rulings, Not Stalls"
1. **Continuous Execution**: Do not pause between tasks to ask "should I continue?". Execute all tasks continuously once approved.
2. **Ledger Rulings**: If ambiguities or minor plan defects arise, make an authoritative engineering decision, record it in your plan notes as `Ruling: <what you decided> - <why> - <cost if wrong>`, and proceed.
3. **Hard Stops**: Stop execution only if encountering:
   - An irreversible or destructive operation.
   - A security-sensitive credential or authentication risk.
   - External side effects outside the workspace (pushing, publishing).
   - A plan so fundamentally broken that every forward path is a guess.

