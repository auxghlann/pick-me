---
name: application-tracker
description: Maintains job application records in data/applications.csv, tracks application statuses, schedules follow-ups, and computes pipeline metrics.
---

# Application Tracker

Manages the RFC 4180 CSV pipeline in `data/applications.csv`.

## Schema
Columns:
1. `ID`: Sequential identifier (`APP-001`, `APP-002`, ...).
2. `Date_Applied`: ISO date (`YYYY-MM-DD`).
3. `Company`: Legal or brand name.
4. `Role`: Position title.
5. `Location`: Location string (e.g., `Remote`, `Manila, Philippines`).
6. `Work_Type`: `Remote`, `Hybrid`, or `Onsite`.
7. `Status`: `Drafted`, `Applied`, `Screening`, `Interviewing`, `Offer`, `Rejected`, or `Ghosted` (21+ days without reply).
8. `Salary_Range`: Disclosed compensation or empty.
9. `Source`: Platform or origin (e.g., `LinkedIn`, `JobStreet`, `Referral`).
10. `Job_URL`: Posting or ATS URL.
11. `Resume_Path`: `~/Documents/pick-me-output/applications/<app_id>_<company>/resume_<company>.pdf`.
12. `Cover_Letter_Path`: `~/Documents/pick-me-output/applications/<app_id>_<company>/cover_letter_<company>.pdf`.
13. `Follow_Up_Date`: Target date (`YYYY-MM-DD`), default `Date_Applied` + 7 days.

## Operations

### 1. Reserve Application ID
Read `data/applications.csv`, inspect existing IDs for the highest sequential integer, and return the next sequential ID (e.g., `APP-012` -> `APP-013`).

### 2. Log Application
Append an RFC 4180 compliant row with the reserved `ID`, current date, role details, `Status` (`Drafted` or `Applied`), generated PDF paths, and `Follow_Up_Date` (+7 days).

### 3. Update Status
Find target row by `ID` or `Company` + `Role`, and transition `Status`. Never delete historical records; transition inactive records to `Rejected` or `Ghosted` to preserve pipeline velocity metrics.

### 4. Report Pipeline Metrics
Scan `data/applications.csv` and report:
- Total Submitted (`Status != Drafted`)
- Active in Pipeline (`Screening` + `Interviewing`)
- Pending Follow-Ups (`Follow_Up_Date <= today` and `Status == Applied`)
- Weekly Submission Velocity

## Constraints
- Preserve CSV header ordering and standard field quoting.
- Strictly zero emojis in CSV data and messages.
