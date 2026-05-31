# Tempo Codex Workflows

This file mirrors Simon's local Codex skills so remote/cloud sessions can use the same workflow even when `/Users/simonrey/.codex/skills` is unavailable.

## codex-matias-os

Use Codex as planner, researcher, builder, reviewer, and project manager. Keep Simon in control through task lists, branches, draft PRs, feature flags, review tables, and check reports.

## codex-plan-product

Use for ideas or feature requests. Produce a product brief, target user, success criteria, assumptions, milestones, task backlog, and first task.

## codex-build-plan

Use for existing plans/backlogs/issues. Pick the highest-impact unblocked task, implement it, test it, update status, and report what changed.

## codex-experiment-batch

Use for asynchronous feature exploration. Research if useful, propose experiments, build behind independent flags, keep them modular, and return this table:

| Flag | Feature | Why It Might Matter | How To Test | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |

## codex-review-loop

Use before merge/deploy. Review for bugs, edge cases, security/privacy, billing/data risks, performance, missing tests, and UX regressions. Fix clear issues and rerun checks.

## codex-dispatch

Use when Simon wants work done while away.

```text
Context:
[repo/product/current state]

Goal:
[what should be true when Simon comes back]

Constraints:
[scope, stack, taste, risks]

Autonomy:
[what Codex can decide alone]

Stop and ask only if:
[decisions that genuinely require Simon]

Output:
[PR, summary, checks, review notes]
```

Default: work on a branch, run relevant checks, open a draft PR for remote work, and stop only for secrets, billing/security/data handling, production migrations, or major architecture changes.
