---
name: linear-agent-project-planning
description: Use when planning large agent-run projects that should become a Linear root issue, task queue, multi-week implementation backlog, or /goal-ready project plan.
---

# Linear Agent Project Planning

Turn a broad project idea into a reviewable Linear root issue first, then into ordered child issues after the root plan is approved. Optimize for self-contained plans, durable task queues, explicit verification, and clear handoff to `linear-goal-runner`.

## Core Rule

Plan big enough to matter. Prefer work that would take a strong engineer days or weeks, then split it into coherent child issues that can be verified independently. Do not turn every file edit into a separate issue.

The root Linear issue is the first review artifact. Create it before child/subissues, get user feedback on that root issue, and split into child issues only after the root plan is approved.

## Workflow

1. Ground in the repo and current product state.
   - Read existing docs, ADRs, domain context, relevant code, and current issue/PR context before asking.
   - Explain unfamiliar domain concepts briefly before using project-specific terms heavily.
2. Clarify only high-impact unknowns.
   - Ask about success criteria, scope boundaries, risk tolerance, and final review-ready definition.
   - Avoid questions that repo or Linear exploration can answer.
3. Create the root issue right away.
   - Use the `linear` skill/tooling.
   - Create one root Linear issue containing the draft plan, even if child issues are not ready yet.
   - Make the issue title and first body clearly reviewable: outcome, current state, proposed approach, major tradeoffs, open questions, verification strategy, and final completion criteria.
   - Do not create child/subissues yet.
4. Run the root-issue review loop.
   - Share the Linear root issue link and a concise summary with the user.
   - Ask the user to review the root issue and give feedback there or in chat.
   - Apply feedback by updating the root issue and recording important decisions or scope changes in Linear comments.
   - Continue until the user explicitly approves the root plan as complete enough to split.
5. Flesh out child issues only after root approval.
   - Treat the approved root issue as the source of truth.
   - Group work into milestones and vertical slices.
   - Mark ordering, dependencies, and whether each issue can run in parallel with other issues via subagents.
   - Include what to do, how to verify, and what proof notes are required before terminal status.
   - Create child/subissues linked to the root. Use Linear's native parent/subissue relation when available; otherwise put `Parent: <root issue key/url>` in each child and comment on the root with the child list.
   - Put child issues in dependency order.
   - Update the root issue with the final child list, milestone ordering, dependency map, and any remaining runner notes.
6. Handoff to execution.
   - Share the root issue link, child issue list, and any known open risks.
   - Tell the user to run `$linear-goal-runner` against the approved root issue when ready.

## Root Issue Template

```md
## Summary
<Project outcome in 2-4 bullets.>

## Current State
<What exists now, with concrete repo/runtime references when useful.>

## Planning Status
Draft root issue for user review. Do not create child/subissues until this root issue is approved. Replace this with the approval decision before splitting.

## Plan
<Implementation approach, key interfaces/contracts, and sequencing.>

## Milestones and Ordering
1. <Milestone name> - <child issue keys once created>

## Parallelism Map
- Can run in parallel: <issue keys and why>
- Must be sequential: <issue keys and dependency reason>

## Verification Strategy
<End-to-end checks, focused tests, UI/browser proof, CI expectations, and any manual smoke tests.>

## Completion Criteria
- All child issues are Done, Canceled, or Duplicate.
- Required milestone PRs are green.
- Root issue has final writeup and is marked review-ready.

## Runner Instructions
Use $linear-goal-runner against this root issue. Maintain scratch logs, mirror meaningful entries to Linear comments, run review gates, batch milestone PRs, and keep going until the queue is terminal.
```

## Child Issue Template

```md
## Parent
<Root issue key/url>

## Milestone / Order
<Milestone name and order number.>

## Parallelism
<Parallel-safe with issue keys, or sequential dependency. Name disjoint ownership boundaries if subagents can help.>

## What to do
<End-to-end behavior or refactor slice. Avoid stale file inventories unless needed to prevent ambiguity.>

## Acceptance Criteria
- [ ] <Observable behavior or codebase outcome>
- [ ] <Verification expectation>

## Verification
<Exact or best-known checks the runner should use. Include screenshots, diagrams, or browser proof when relevant.>

## Proof Required Before Terminal Status
- Summary of work completed.
- Explicit verification commands/results.
- Relevant images or Mermaid diagrams if useful.
- Commits and PR links, if created.
- $autoreview result.
- Fresh read-only subagent review result.
- Overengineering check.
```

## Comment Guidance

Use Linear comments during planning for assumptions, user decisions, and important scope changes. Do not flood Linear with routine exploration notes; the execution skill owns high-frequency scratch logging.
