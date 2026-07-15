---
name: codex-handoff
description: Continue work in a new persistent Codex thread with parent/child emoji naming, permission-aware delegation, pinning, and verification. Use when the user asks to hand off, delegate, continue in another Codex session or thread, or create a visible receiving thread for ongoing work.
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

## Workflow

1. Inspect the source Codex thread title and establish the shared emoji.
2. Create the receiving thread in the correct environment.
3. Set its title, send the work order, and pin it.
4. Read back the resulting state before reporting completion.

## Thread Environment

- Default to a persistent Codex thread in the same local checkout or project.
- Prefer an exact same-directory fork when continuity with the current checkout
  matters.
- Use an isolated worktree or remote environment only when the user requests it,
  repository instructions require it, or overlapping edits make sharing unsafe.
- A transient background subagent is not equivalent to a persistent receiving
  Codex thread. Do not substitute one when the requested handoff must remain
  visible and pinnable.
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

## Parent And Receiving Thread Titles

Use one leading emoji to visually group the source and receiving threads:

1. Inspect the source thread title before creating the receiver.
2. If it begins with an emoji, preserve that exact leading emoji sequence.
3. If it has no leading emoji, choose one relevant to the work and rename the
   source thread first.
4. Apply the same emoji to the receiving thread.
5. Prefer `<emoji> <issue-key> <issue-title>` when an issue exists. Otherwise use
   `<emoji> <concise task title>`.

Do not claim a complete handoff until the source and receiving thread titles use
the same leading emoji when title-management tools are available.

## Receiving Prompt

Give the receiving thread:

- a direct instruction to begin the next action
- the durable source of truth with its full reference or URL
- any supplied handoff document or transfer-artifact path
- the repository, branch, and checkout-sharing context
- the spawning or orchestrator thread identifier and return-reporting path
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

## Blocker Reporting

Every receiving prompt must instruct the worker to report blockers directly to
the spawning or orchestrator thread. Include that thread's identifier in the
prompt whenever it is available.

- Do not let a blocked worker merely stop, go idle, or mention the blocker only
  in its own final response.
- Report a blocker after normal diagnosis and retries show that the worker
  cannot continue autonomously. Ordinary command failures under full
  permissions are not blockers until their actual technical cause is known.
- Send the parent a concise report containing:
  - the full issue or task reference
  - the concrete blocker and what was attempted
  - the exact safe next action or access needed
  - current branch, commit, deployment, and validation state when relevant
  - whether any provider objects, credentials, permissions, or live state changed
- Never include secret values, credential material, sensitive command output,
  or archive contents in the report.
- Continue any independent unblocked work after reporting. If no work remains,
  stay available for a parent response instead of repeatedly prompting the user.
- If direct thread messaging is unavailable, record the blocker on the durable
  issue when appropriate and make the structured blocker report the worker's
  final response so the parent can relay it.

For a receiving worker, include an instruction equivalent to:

> If you become blocked after normal diagnosis, immediately report the concrete
> blocker to orchestrator thread `<thread-id>`. Include what you tried, the exact
> non-secret action or access needed, current proof/state, and whether anything
> changed. Do not ask the user for routine command approval or silently go idle.

## Completion Gate

Complete the handoff only after verifying:

- the receiving persistent thread exists
- source and receiving titles have the same leading emoji
- the receiving prompt contains the durable source and any supplied artifact
- the receiving prompt contains the parent return path and blocker-reporting
  instruction
- the receiving thread is pinned
- the receiver has started or accepted the work when readback is available
- the receiver is not waiting for approval on an ordinary command that should
  run under its effective permission profile

If thread creation, title management, or pinning is unavailable, produce a
ready-to-send receiving prompt. State exactly which operation could not be
completed and do not describe the handoff as fully delegated.

If readback shows `waitingOnApproval`, inspect the reason before reporting
completion:

- For an ordinary command under full permissions, send a correction requiring
  the normal non-escalated command path and verify that work resumes.
- For a genuine external action-time confirmation, report the exact safe action
  needed without exposing secrets.
- A receiver stuck on a stale or unnecessary approval is not a completed
  handoff.

Report any supplied artifact path, receiving thread title and identifier,
checkout mode, and pin state concisely.
