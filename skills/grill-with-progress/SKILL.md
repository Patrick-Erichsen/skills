---
name: grill-with-progress
description: "Run Matt Pocock's grill-with-docs workflow with a temporary Markdown question ledger, ask the full anticipated question set in one batch, and show visible answer progress. Use when the user wants to grill or stress-test a plan, design, decision, or idea while seeing anticipated scope and progress."
---

# Grill with Progress

Locate and read the installed `grill-with-docs/SKILL.md` at runtime, then follow
it as the base workflow. Do not rely on implicit skill activation. Do not copy,
edit, or replace its instructions. Apply the following progress-tracking
contract in addition to the upstream behavior. If the upstream skill cannot be
found, stop and tell the user.

The batching contract below intentionally overrides any upstream instruction to
ask one question at a time.

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

- Status: awaiting answers
- Answered: 0/10
- Total anticipated questions: 10
- Updated: <ISO-8601 timestamp>

## Decisions

- None yet.

## Question checklist

- [ ] **ASKED Q1.** <question> **Recommended:** <recommended answer>
- [ ] **ASKED Q2.** <question> **Recommended:** <recommended answer>

## Removed questions

- None.

## Changes

- Initial plan: 10 questions.
```

## Maintain the Ledger

Update the file before every user-facing grilling message:

- Mark an answered question `[x]` and append its answer and resulting decision.
- Update `Answered` to the number of resolved active questions.
- Keep every unresolved question marked `ASKED`; there is no single `CURRENT`
  question.
- Keep each question and its recommended answer in the ledger so the file is
  self-contained.
- Add newly discovered questions to the checklist with when and why they were
  added, then ask all newly discovered and still-unresolved questions together
  in the next grilling message.
- Move removed questions to `Removed questions`; retain their text and record
  when and why they were removed. Mark them `[x]` and label them `Removed, not
  answered`.
- Record every total change in `Changes`, including the old total, new total,
  and reason.
- Keep `Decisions` as a concise cumulative list.

The denominator is the current number of active anticipated questions. Answer
progress is the number of resolved active questions. Retain stable `Q`
identifiers when the question set changes.

## Render the Ledger

The ledger is the source of truth for every user-facing grilling message.

- After updating it, read the file and include its complete current contents
  directly in the chat as rendered Markdown.
- Do not wrap the ledger in a code fence, blockquote, or collapsible section.
  Its headings, checklists, and lists must render normally in the conversation.
- Do not replace the ledger with a summary, excerpt, separately reconstructed
  question list, or file path.
- Brief framing text may appear before the ledger when useful, but the full
  ledger must still be shown.
- The progress footer goes after the rendered ledger.
- Show the complete final ledger after all decisions are resolved and again
  when asking the user to confirm shared understanding.

## Show Progress

End every user-facing message during the grill with one blank line followed by
a standalone progress footer. The message shape is: optional brief framing,
the complete ledger rendered directly as Markdown, then `(Answered n/N)` on its
own final line.

- Put the complete initial question set and each recommended answer in the
  ledger, show the whole file, and end with `(Answered 0/N)`.
- After the user answers, show the updated resolved count, such as
  `(Answered 6/10)`.
- If the total changes, immediately explain the previous total, new total, and
  reason, then use the revised denominator.
- After the last answer, use `(Answered N/N)` while asking the user to confirm
  shared understanding and in the final grill-status message.

## Preserve the Grill

Put every anticipated decision question and its recommended answer in the
ledger, then show the complete ledger at once. Do not stop after each question
to wait for feedback. If the answers expose genuinely new decisions, add all
remaining and new questions to the ledger and show the complete updated file in
the next grilling message. Research discoverable facts instead of asking the
user. Do not begin implementation until every decision is resolved and the user
confirms shared understanding.
