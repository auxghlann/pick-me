# Implementation Plans (`.spec/plans/`)

This directory houses the planning system for `pick-me`. It uses bite-sized task contracts and continuous execution to build features reliably without documentation drift.

## Lifecycle

1. **Drafting**:
   - For non-trivial features, refactorings, or fixes, author an implementation plan based on `PLAN-TEMPLATE.md`.
   - Active plans are rendered as native artifacts in `<appDataDir>/brain/<conversation-id>/plan.md` with `RequestFeedback: true`.
2. **Review Gate**:
   - The user reviews the plan and provides feedback or clicks **Proceed**.
3. **Continuous Execution ("Rulings, Not Stalls")**:
   - Once approved, execute all tasks continuously without pausing after every task.
   - Adjudicate ambiguities by recording rulings in the task ledger (`Ruling: <decision> - <why> - <cost if wrong>`).
   - Halt execution only for destructive actions, security risks, external side effects, or fundamentally broken plans.
4. **Archiving**:
   - Upon completion and verification, export the finished plan to `completed/<YYYY-MM-DD-feature-name>.md`.

## Directory Structure

```text
.spec/plans/
|-- README.md            # Plan lifecycle documentation
|-- PLAN-TEMPLATE.md     # Standard TDD plan template
`-- completed/           # Archive of executed plans
```

