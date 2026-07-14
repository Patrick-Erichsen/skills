---
name: grill-with-progress
description: Run Matt Pocock's grill-with-docs workflow with a temporary Markdown question ledger and a visible (n/N) prefix on every grilling message. Use when the user wants to grill or stress-test a plan, design, decision, or idea while seeing anticipated scope and progress.
---

# Grill with Progress

Use the installed `$grill-with-docs` skill as the base workflow. Do not copy,
edit, or replace its instructions. Apply the following progress-tracking
contract in addition to the upstream behavior.

## Start the Ledger

Before asking the first question:

1. Research facts available from the environment instead of turning them into
   questions for the user.
2. Sketch the anticipated decision tree and its ordered question set.
3. Create
   `${TMPDIR:-/tmp}/codex-grills/<UTC-timestamp>-<topic-slug>.md`.

The ledger must live in the operating system's temporary directory, never in
the repository or worktree. Create the parent directory if needed. Do not
commit the ledger.

Use this shape:

```markdown
# Grill: <topic>

- Status: active
- Current position: 1/10
- Total anticipated questions: 10
- Updated: <ISO-8601 timestamp>

## Decisions

- None yet.

## Question checklist

- [ ] **CURRENT Q1 (position 1/10).** <question>
- [ ] Q2. <question>

## Removed questions

- None.

## Changes

- Initial plan: 10 questions.
```

## Maintain the Ledger

Update the file before every user-facing grilling message:

- Mark an answered question `[x]` and append its answer and resulting decision.
- Mark exactly one pending question as `CURRENT` and update `Current position`.
- Add newly discovered questions to the checklist with when and why they were
  added.
- Move removed questions to `Removed questions`; retain their text and record
  when and why they were removed. Mark them `[x]` and label them `Removed, not
  answered`.
- Record every total change in `Changes`, including the old total, new total,
  and reason.
- Keep `Decisions` as a concise cumulative list.

The denominator is the current number of active anticipated questions. The
numerator is the current active question's position. Renumber active positions
when the plan changes, while retaining stable `Q` identifiers and the change
history.

## Show Progress

Begin every user-facing message during the grill with exactly `(n/N)`, before
any other text.

- Ask the first question with `(1/N)`.
- After answering question 1 and advancing, ask question 2 with `(2/N)`.
- If the total changes while on question 4, use the revised prefix such as
  `(4/12)` and immediately explain the previous total, new total, and reason.
- If replying without advancing, keep the current position in the prefix.
- After the last answer, use `(N/N)` while asking the user to confirm shared
  understanding and in the final grill-status message.

## Preserve the Grill

Ask one decision question at a time, include a recommended answer, and wait for
the user's response. Research discoverable facts instead of asking the user.
Do not begin implementation until the user confirms shared understanding.
