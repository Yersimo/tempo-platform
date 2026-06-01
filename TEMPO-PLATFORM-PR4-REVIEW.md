# Tempo Platform PR #4 Review

## Review Scope

Reviewed the benchmark-led command center layer in draft PR #4, including the shared `ModuleCommandCenter`, the roadmap, and command-center usage across the 36 covered modules.

## Product Review

| Area | Review result | Notes |
| --- | --- | --- |
| Product direction | Pass | The PR creates a consistent benchmark-led operating layer without changing persistence, auth, billing, payroll, payments, migrations, or production integrations. |
| UX consistency | Pass with follow-up | The command centers use a consistent structure: benchmark, readiness score, four metrics, three focus areas, and three next actions. Full visual QA is still blocked locally by missing DB/auth env. |
| Routing | Pass | Actions route to existing tabs or existing hrefs. No new critical workflow state is introduced by the command centers. |
| Copy and positioning | Pass with editorial review | The benchmark language is clear enough for review. Simon should still approve tone and competitor references before merge. |
| Risk profile | Low | The PR is additive and reviewable. The largest risk is broad surface area, not destructive behavior. |

## Browser QA Status

Targeted Playwright route sweep was attempted for the affected authenticated route groups. It is blocked before route rendering because `/api/auth` imports the Neon database client and no `DATABASE_URL` is configured in this clone.

Blocked error:

```text
No database connection string was provided to neon(). Perhaps an environment variable has not been set?
```

Required before full visual/browser QA:

- Add a valid local `DATABASE_URL`.
- Add the auth/session env needed by demo login.
- Re-run authenticated route sweep and screenshots for the changed module groups.

## Merge Recommendation

Recommendation: merge PR #4 after Simon reviews the command center copy and after either:

- the DB/auth-backed route sweep passes locally or in CI, or
- Simon explicitly accepts merging this additive orientation layer with visual QA deferred.

Do not deploy to production from this PR until visual QA has passed in an environment with the required auth/database settings.

## Next Experiment Started

The first deeper feature experiment is the Expense experiment bench. It adds selectable review-mode options for:

- Ramp approval cockpit
- ETI policy confidence
- Reimbursement timeline
- Budget guardrails

This is intentionally UI/state-only for review. It does not alter payments, approvals, reimbursements, payroll posting, database schema, or production routing.
