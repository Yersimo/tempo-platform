# Tempo Platform PR5: Ramp-Grade Expense Workflow

## Implemented In This Slice

The Expense reports tab now includes an approver cockpit for pending reports.

It sorts and summarizes reports by:

- Missing receipt evidence
- Policy signals from the existing compliance checks
- Fraud/anomaly score
- High-value approval threshold
- Budget watchlist pressure

Each cockpit card shows amount, receipt count, risk score, blockers, suggested route, and an action that opens the report detail.

The new expense report modal now includes a submit readiness checklist for employees.

It summarizes:

- Required employee/title/line-item completeness
- Receipt evidence readiness
- Recent same-amount duplicate risk
- Expected reimbursement path after approval

## Safety Boundary

This slice does not change:

- Expense submission
- Approval or rejection behavior
- Reimbursement behavior
- Payment state
- Posting, ledger, payroll, or bank-file behavior
- Persistence models or schema

It only adds a decision layer before existing actions.

## Next Expense Slices

1. Reimbursement timeline: show employees and finance what happens after approval.
2. Budget impact preview: expose cost-center impact before approvers approve.
3. Exception resolution: give finance a queue for receipt gaps, duplicate warnings, policy exceptions, and high-risk reports.
4. Visual/browser QA once `DATABASE_URL` and auth/session env are available.
