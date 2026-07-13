---
name: codex-handoff
description: Continue work in a new persistent Codex thread with parent/child emoji naming, same-checkout delegation, pinning, and verification. Use when the user asks to hand off, delegate, continue in another Codex session or thread, or create a visible receiving thread for ongoing work.
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
- important constraints and non-goals
- the expected validation and completion evidence
- an instruction to read repository guidance and re-check live state before edits

Reference existing artifacts instead of duplicating their contents. Never place
secrets or credentials in the prompt or handoff document.

When the work uses an issue tracker, use the configured tracker adapter for
issue lookup, comments, status, and proof conventions. Do not make a particular
tracker mandatory for otherwise valid handoffs.

## Completion Gate

Complete the handoff only after verifying:

- the receiving persistent thread exists
- source and receiving titles have the same leading emoji
- the receiving prompt contains the durable source and any supplied artifact
- the receiving thread is pinned
- the receiver has started or accepted the work when readback is available

If thread creation, title management, or pinning is unavailable, produce a
ready-to-send receiving prompt. State exactly which operation could not be
completed and do not describe the handoff as fully delegated.

Report any supplied artifact path, receiving thread title and identifier,
checkout mode, and pin state concisely.
