---
name: codex-handoff
description: Continue work in a new persistent Codex thread with Linear issue-title alignment, permission-aware delegation, and verification. Use when the user asks to hand off, delegate, continue in another Codex session or thread, or create a visible receiving thread for ongoing work.
---

# Codex Handoff

Create and verify the persistent Codex thread that receives delegated work.

## Inputs

Identify:

- the durable source of truth, such as an issue, PRD, pull request, or accepted
  specification
- the intended next action
- any existing handoff document or other transfer artifact supplied by the
  caller
- the repository, branch, and desired thread environment
- the effective runtime permission profile, approval policy, and any genuine
  external action-time confirmation boundaries
- when applicable, the root issue and active goal that will monitor this
  receiver after handoff

## Workflow

1. Read the durable issue title when the handoff is issue-backed.
2. Before a GitHub review handoff, run the `github-review-triage` hard preflight.
   Resolve and inspect the existing Linear tracking issue before creating a
   receiver. If the current PR head was already reviewed, do not create a new
   receiver. If the head changed, reuse the existing issue for the new review.
3. Create the receiving thread in the correct environment.
4. Set its title and send the work order.
5. Read back the resulting state before reporting completion.
6. If this handoff belongs to a monitored issue tree, register the receiver with
   the active goal and return control to the orchestration loop.

## Thread Environment

- Default to a persistent Codex thread created with `create_thread` in the same
  local project. Use the local environment when the receiver should share the
  current checkout, or a worktree environment when isolation is required.
- Do not default to `fork_thread` for a managed handoff. Forked threads may
  inherit the source title while remaining visible in `list_threads`, yet still
  be rejected by `set_thread_title` with `No Codex thread found for threadId`.
  A receiver that cannot be titled does not satisfy this skill.
- Use `fork_thread` only when preserving completed conversation history is
  essential and the current runtime has already demonstrated that title
  management works for forked threads.
- Use an isolated worktree or remote environment only when the user requests it,
  repository instructions require it, or overlapping edits make sharing unsafe.
- A transient background subagent is not equivalent to a persistent receiving
  Codex thread. Do not substitute one when the requested handoff must remain
  visible.
- Tell the receiver when the checkout is shared. Require it to inspect
  `git status` before editing, keep changes scoped, and avoid reverting or
  committing unrelated work.

## Execution Permissions And Confirmations

Preserve the caller's effective execution profile when creating the receiving
thread. Do not make a full-permission worker behave like a sandboxed worker.

- If the user requested full permissions, or the runtime reports unrestricted
  filesystem and network access with approval policy `never`, state that
  explicitly in the receiving prompt.
- Under that profile, run ordinary shell, Git, GitHub, network, package,
  build, test, deploy-readiness, and read-only provider commands directly.
  Do not request sandbox escalation, add `sandbox_permissions:
  require_escalated`, show an `Allow once` prompt, or pause merely because a
  command accesses a private repository, the network, or a path outside the
  checkout.
- If a normal command fails, inspect the actual error and retry or diagnose it
  normally. Do not reinterpret a command failure as an approval requirement
  unless the runtime explicitly reports one.
- Full runtime permission does not waive mandatory external action-time
  confirmations. Continue to follow the active tool or platform policy for
  actions such as creating accounts or persistent credentials, changing
  permissions, transmitting secrets, spending money or provisioning paid
  resources, destructive operations, and representational communication.
- Preserve any stricter confirmation boundary explicitly required by the
  user's source specification. Do not invent additional confirmation gates.
- If the effective permission profile is unknown, use the normal command path
  first. Do not preemptively request escalation.

## Receiving Thread Titles

For an issue-backed handoff, the Linear issue title is the canonical receiving
thread title:

1. Read the issue's displayed title from the tracker immediately before creating
   the receiver.
2. Set the receiving thread title to that title exactly, including any ordered
   prefix such as `01 - ...`.
3. Do not prepend an emoji, issue key, parent title, or any other text.
4. Read the receiving thread back and verify its title exactly matches the
   tracker title before reporting a completed handoff.

For a non-issue handoff, use `<emoji> <concise task title>` and preserve the
source thread's leading emoji when possible.

## Thread Creation And Title Failures

Create and title the receiver as one verified operation:

1. Use `create_thread` and retain the returned `threadId`.
2. Call `set_thread_title` with that exact ID.
3. Read the thread back and compare the title with the expected title.

If title management returns `No Codex thread found for threadId`:

- Do not repeatedly rename the source thread or guess a replacement thread ID.
- Check whether the receiver was created with `fork_thread`. If so, treat the
  fork as unmanaged and create a replacement receiver with `create_thread`.
- If a worktree fork returned a `clientThreadId` with `threadId: null`, wait for
  setup to complete; never use the client ID as a thread ID.
- If a `create_thread` receiver briefly fails lookup, confirm it appears in
  `list_threads`, retry title management once, and then report the exact
  operation as incomplete if it still fails.
- Never claim the handoff is complete merely because the worker started. Title
  verification is required independently.

## Goal Integration

Keep this skill focused on one durable handoff. Use `drive-to-completion` to own
the monitoring loop across an issue tree.

When the user explicitly asks to monitor or drive all created issues, or when an
active goal already covers the handed-off issue:

1. Read the active goal before handing off.
2. If no relevant goal exists and the user explicitly requested monitored
   completion, create one whose scope is the root issue and all descendants.
3. Record the receiving task title, thread ID, checkout/worktree, and issue
   reference so the goal can poll it later.
4. Return to the goal's issue-monitoring loop after the receiver starts. A
   successful handoff is progress, not completion.

Do not create a persistent goal for an ordinary one-off delegation unless the
user asked for monitoring or completion. Do not replace an unrelated active
goal.

## Receiving Prompt

Give the receiving thread:

- a direct instruction to begin the next action
- the durable source of truth with its full reference or URL
- any supplied handoff document or transfer-artifact path
- the repository, branch, and checkout-sharing context
- the spawning or orchestrator thread identifier as a blocker-reporting path
- important constraints and non-goals
- the expected validation and completion evidence
- an instruction to read repository guidance and re-check live state before edits
- the effective runtime permission and approval policy, clearly separated from
  genuine external action-time confirmations

Reference existing artifacts instead of duplicating their contents. Never place
secrets or credentials in the prompt or handoff document.

For a full-permission receiver, include an instruction equivalent to:

> Use normal commands with the current full filesystem and network access.
> Do not request sandbox escalation or pause for ordinary shell, Git, GitHub,
> network, build, test, or read-only provider work. Pause only for genuine
> external action-time confirmations required by the active policy or source
> specification.

When the work uses an issue tracker, use the configured tracker adapter for
issue lookup, comments, status, and proof conventions. Do not make a particular
tracker mandatory for otherwise valid handoffs.

## GitHub Review Handoffs

A request to review a GitHub pull request or issue includes a public GitHub
closeout by default. Treat the review as private or no-comment only when the
user explicitly requests that boundary.

Every GitHub review receiving prompt must instruct the worker to:

1. Refresh the live head and existing maintainer comments immediately before
   posting. Never publish findings against a stale SHA.
2. Post a concise GitHub issue/PR comment after the review, with findings
   ordered by severity, exact reviewed SHA, best-fix verdict, and material
   validation or proof gaps. When there are no findings, say so directly and
   name any residual risk.
3. Use a normal issue/PR comment by default. Do not submit `APPROVE` or
   `REQUEST_CHANGES` unless the user explicitly requests a formal review state.
4. Add the resulting public GitHub comment link to the durable Linear review
   issue when one exists.

If an earlier receiving prompt said not to comment and the user later requests
public closeout, send an explicit override to the existing receiver. Completed
receivers must recheck the live head before posting their already-recorded
findings.

## Blocker Reporting

Every receiving prompt must instruct the worker to report genuine blockers
directly to the spawning or orchestrator thread. Include that thread's
identifier whenever it is available.

- Report only after normal diagnosis and retries show that the worker cannot
  continue autonomously.
- Include the concrete blocker, what was attempted, the exact non-secret action
  or access needed, current branch/commit/validation state when relevant, and
  whether anything changed.
- Never include secrets, credential material, sensitive output, or archive
  contents.
- Continue any independent unblocked work after reporting.
- Do not require routine progress reports to the parent.

## Completion Reporting

For issue-backed handoffs, every receiving prompt must instruct the worker to
pass completion proof back to the spawning or orchestrator thread:

1. For GitHub review work, post the required public GitHub closeout first.
2. Record the final implementation or review and validation proof in a durable
   comment on the issue, including the GitHub closeout link when applicable.
3. Send the calling thread only the direct proof link requested by the handoff.
4. Do not duplicate the proof ledger in the calling thread.

If the handoff is not issue-backed, keep normal completion in the receiving
thread unless the caller explicitly requests another durable proof location.

For a receiving worker, include an instruction equivalent to:

> If you become blocked after normal diagnosis, report the concrete blocker to
> orchestrator thread `<thread-id>`, including what you tried and the exact
> non-secret action needed. Do not send routine progress reports to the parent.
> When the issue-backed work is complete, record the full proof in Linear, then
> send the orchestrator only the direct link to that proof comment.

## Completion Gate

Complete the handoff only after verifying:

- the receiving persistent thread exists
- the receiver was created through a thread path supported by title management
- for an issue-backed handoff, the receiving title exactly matches the current
  Linear issue title
- for a non-issue handoff, the receiving title uses the source thread's leading
  emoji when title management is available
- the receiving prompt contains the durable source and any supplied artifact
- the receiving prompt contains the blocker-reporting path
- for GitHub review work, the receiving prompt requires an exact-head public
  GitHub closeout unless the user explicitly requested private/no-comment work
- for issue-backed work, the receiving prompt requires a Linear proof comment
  and a proof-link-only completion report to the calling thread
- the receiver has started or accepted the work when readback is available
- the receiver is not waiting for approval on an ordinary command that should
  run under its effective permission profile
- when part of monitored work, the receiver is included in the active goal's
  issue/thread map

If thread creation or title management is unavailable, produce a ready-to-send
receiving prompt. State exactly which operation could not be completed and do
not describe the handoff as fully delegated.

If readback shows `waitingOnApproval`, inspect the reason before reporting
completion:

- For an ordinary command under full permissions, send a correction requiring
  the normal non-escalated command path and verify that work resumes.
- For a genuine external action-time confirmation, report the exact safe action
  needed without exposing secrets.
- A receiver stuck on a stale or unnecessary approval is not a completed
  handoff.

Report any supplied artifact path, receiving thread title and identifier,
and checkout mode concisely.
