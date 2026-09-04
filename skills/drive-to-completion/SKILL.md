---
name: drive-to-completion
description: Drive a durable root issue and all recursively created subissues through implementation, verification, review, acceptance, and closeout using an explicit Codex goal plus persistent handoff threads. Use when the user explicitly asks to monitor all created issues, run an issue tree until complete, keep delegated Codex tasks moving, or invokes $drive-to-completion.
---

# Drive to Completion

Own the orchestration loop for a durable issue tree. Compose `codex-handoff` for
each persistent implementation task instead of duplicating its thread-creation,
title, permission, pinning, and blocker-reporting contract.

## Start the Goal

This skill starts persistent goal tracking only because the user explicitly
requested completion monitoring.

1. Identify the durable root issue, PRD, or accepted specification.
2. Read the root and recursively enumerate all descendants, including blockers,
   dependencies, current statuses, and existing implementation threads.
3. Call `get_goal`.
4. If no goal exists, call `create_goal` with an objective that names the root
   and requires every in-scope issue to reach verified completion.
5. If the active goal already covers this root, continue it. If it is unrelated,
   do not replace it; report the conflict and preserve both scopes.

The goal remains active while any issue is implementing, blocked, awaiting
review, or awaiting user acceptance. Delegating work is not goal completion.

## Maintain the Issue Map

Refresh live tracker state at the start of every goal continuation. Subissues may
create more subissues, so never treat the initial tree as fixed.

Classify every in-scope issue as:

- ready to dispatch
- actively implementing
- awaiting review
- blocked by another issue or external action
- done

Track the issue reference, exact title, status, dependencies, receiving thread
ID, worktree or checkout, branch, latest commit/PR, validation state, and last
meaningful activity. For a large issue tree, maintain the root issue's
`Running Summary` and `Validation` sections when repository conventions require
them.

## Dispatch Ready Work

For each ready issue that has no active receiver:

1. Use `codex-handoff` to create a persistent, titled, pinned implementation
   thread.
2. Give it the exact issue, parent context, repository guidance, validation
   expectations, and orchestrator return path.
3. Record the receiver in the issue map and, when useful, in a tracker comment.
4. Avoid duplicate receivers for one issue.

Default to one active implementor for overlapping work in a shared checkout.
Parallelize only when worktrees or clearly non-overlapping surfaces make it safe.

## Monitor Continuously

On every goal continuation:

- Read all nonterminal receiver threads and tracker statuses.
- Compare the worker's claimed state with live Git, PR, CI, deployment, or other
  required proof.
- If a worker is active, let it continue.
- If it is idle and the next action is clear, send a concise continuation.
- If it reports a blocker, diagnose or resolve it; escalate only the exact
  external action that cannot be completed autonomously.
- If it finished but tracker state is stale, verify the work before updating the
  issue.
- If it created new subissues, add them to the map and dispatch them when ready.

Do not stop after saying work was handed off. The goal exists to keep the whole
tree moving.

## Review and Close

When a receiver claims implementation is complete:

1. Check the issue acceptance criteria against the actual diff and behavior.
2. Verify commits, targeted tests, required repository gates, PR/CI state, and
   any production or user-visible proof required by the issue.
3. Run the repository's required review process and return actionable findings
   to the receiver.
4. Move the issue to `Awaiting Review` only after implementation evidence is
   complete.
5. Keep the goal active until the user explicitly accepts work that repository
   policy requires them to approve.
6. After acceptance, move the issue to `Done`, unpin its implementation thread,
   and verify the unpin.

Do not merge, deploy, publish, change permissions, create credentials, or take
another externally consequential action unless the user authorized that action
or the active policy permits it.

## Goal Lifecycle

- Call `update_goal(status="complete")` only when every in-scope issue is `Done`,
  all implementation threads are unpinned, and no required work remains.
- Call `update_goal(status="blocked")` only after the same blocking condition
  has persisted for at least three consecutive goal turns and no meaningful
  progress is possible without user input or an external state change.
- Never mark the goal complete because a budget is low, a worker finished one
  slice, or the orchestrator is ending a turn.
- When complete, report the root issue, final issue counts, PRs/commits,
  validation evidence, and any intentionally deferred work.
