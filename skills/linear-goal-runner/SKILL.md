---
name: linear-goal-runner
description: Use when executing a Linear-backed project queue, continuing /goal work from a root issue, driving child issues to terminal states, or preparing milestone PRs for review.
---

# Linear Goal Runner

Run a Linear root issue as a long-lived implementation queue. Keep working until every child issue is terminal: Done, Canceled, or Duplicate, and the root issue has a final review-ready writeup.

## Core Rules

- Treat the Linear root issue as the project plan and source of truth.
- Treat child issues as the executable queue.
- Add newly discovered in-scope work as new child issues instead of hiding it in notes.
- Use subagents for independent, disjoint child issues or read-only review when the environment and user authorization allow it.
- Do not mark a child issue terminal until the closeout gate passes.

## Start or Resume

1. Resolve the Linear root issue.
2. Read the root plan, child issues, comments, statuses, labels, dependencies, and linked PRs.
3. Build the active queue:
   - Ready: dependencies terminal and acceptance criteria clear.
   - Blocked: waiting on another issue, user decision, credential, external service, or failing prerequisite.
   - Terminal: Done, Canceled, or Duplicate.
4. Start or continue `/goal` with the objective: finish the root issue by driving every child to a terminal status and keeping milestone PRs green.
5. Prefer the next ready milestone task. Parallelize only when write scopes are disjoint and ordering says it is safe.

## Scratch Log and Linear Comments

Maintain a temporary local scratch log for each active child issue:

```sh
/tmp/linear-goal-runner-<root-key>-<child-key>.md
```

Append timestamped notes for decisions, tradeoffs, missing requirements, scope changes, discovered work, review fixes, verification choices, and overengineering checks.

Post each meaningful scratch-log entry to the active Linear child issue immediately. Use this comment shape:

```md
## Scratch Log: <short title>

Context: <what forced the decision or discovery>
Decision: <what changed or what path was chosen>
Tradeoff: <why this path over the alternative>
Follow-up: <new issue key, verification need, or none>
```

Do not comment for routine command output, obvious file reads, or progress that has no decision value.

## Working a Child Issue

1. Re-read the child issue, the root plan, and recent comments.
2. Confirm ownership boundaries and whether subagents can safely work in parallel.
3. Implement the smallest coherent slice that satisfies the child issue.
4. If new in-scope work appears, create a new child issue linked to the root with ordering and dependency metadata.
5. If the child issue is wrong, too broad, duplicate, or no longer valuable, comment with the rationale and mark it Canceled or Duplicate instead of silently reshaping it.

## Closeout Gate

Before marking a child issue Done, Canceled, or Duplicate, add a Linear closeout comment with:

- Summary of what changed or why the issue is not being completed.
- Explicit verification commands and results.
- Relevant screenshots, image attachments, or Mermaid diagrams if they clarify UI, architecture, or data flow.
- Commit SHAs for the task work.
- `$autoreview` result, or the strongest repo-local equivalent if `$autoreview` is unavailable.
- Fresh read-only subagent review of the diff against the root plan and child issue, including gaps found and fixes made.
- Overengineering check: what was kept simple, what was intentionally not generalized, and any remaining risk.

Only then update the Linear status.

## Review and PR Cadence

- Commit at useful task boundaries before closeout.
- Batch related terminal child issues into one milestone PR by default.
- Use one PR per task only when isolation or rollback risk demands it.
- After opening a milestone PR, use `all-green` behavior: inspect review feedback and required CI, fix actionable failures, push, and repeat until required checks are green and actionable review feedback is clear.
- Post PR links back to each included child issue and to the root issue.

## Root Issue Finish

When every child issue is Done, Canceled, or Duplicate:

1. Confirm required milestone PRs are green.
2. Add a final Linear root comment:
   - Completed child issues by milestone.
   - Canceled/duplicate issues and why.
   - PR links and final checked SHAs.
   - Verification summary.
   - Important decisions/tradeoffs from scratch-log comments.
   - Missing requirements the user may want to specify next time.
3. Mark the root issue review-ready using the repo/team's Linear status or label convention.

Stop only when the queue is terminal, green PR state is recorded, or a real blocker needs user judgment.
