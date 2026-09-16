# Human-gated recurring preparation

This opt-in mode is for an operator-authorized recurring preparation loop. It
does not inherit standard mode's landing authorization or ten-item prepare cap.
Target about 20 distinct completed review packages per repository run. Never pad
with blocked work, metadata proposals, already-prepared unchanged heads, or
unverified claims. Exhausted eligible intake can produce fewer than 20.

## Discover and own

1. Recover the canonical sweep ledger and native task receipts. Respect active
   reservations, handled heads and existing owners. Freeze intake at run start.
   A loop adapter may mirror outcomes into a tracker; the sweep ledger still owns
   PR coordination and must not become a competing tracker queue.
2. Consume all provided contributor requests before new-then-backlog discovery.
   Refresh open/head state before expensive hydration. Include older unmerged
   requests, not only new messages. Deduplicate by repository and PR number.
3. Apply the existing operator-selection policy for risk, release relevance,
   user value, duplicates and proof. Security, configuration, CI infrastructure,
   availability and other excluded surfaces do not become repair candidates to
   fill a quota. Good but judgment-heavy PRs can be recorded for human decision;
   they count as prepared only with a substantive review and an explicit decision.
4. In this mode, maintainer *active ownership*, not any historical participation,
   excludes work. Check current assignees, requested reviewers, unresolved review
   conversations, explicit claims, recent ongoing work, native tasks and ledgers.
   An old comment alone is not ownership. Incomplete evidence fails closed.
   Keep the participation evidence and record the ownership verdict and sources.
   The current hydrated ranker implements the stricter standard-mode rule: do
   not use its participation rejection as this mode's ownership verdict, erase
   interactions, or pass manufactured clean metadata. Use cheap ranking for
   ordering, then independently apply every hydrated risk/proof gate with this
   documented ownership substitution. Standard mode is unchanged.
5. Claim eligible work through the repository maintainer workflow only after
   checking conflicting ownership. Preserve contributor authorship. Record a
   dedicated persistent review/work session before repairs and use it on reruns.

## Review, repair, prove

Load the current repository's `openclaw-pr-maintainer`, `openclaw-testing`,
`autoreview`, and `openclaw-ci-limits` skills. Load Crabbox and ClawSweeper when their
capabilities are used. The installed repo's actual maintainer workflow owns repair
and proof; this mode does not depend on a missing `openclaw-landable-bug-sweep`
skill. Record unavailable required capabilities as blockers, not successful gates.

Use isolated worktrees and the repository's proof/review helpers. Focused repairs
are authorized on an editable contributor branch only when its live ownership,
maintainer-edit setting and exact head have been verified. Never force-push over
external work. If the branch is not editable, return a patch and blocker rather
than silently replacing or closing the contributor's PR. Task-owned new fixes may
be published under the loop's separate implementation authority.

Use the existing retained-worker model and shared host/CI capacity. Acquire a
shared capacity lease before each expensive worker, not two workers per loop.
Read `ci-limits` before queue/runner/CI actions; do not change CI settings to make
the batch faster. All children use unlimited run timeout; native waits bound one
observation, never the total worker run. Follow execution-control receipts and
independent review rules; only the coordinator writes shared ledgers or branches.

## Stop at signoff

For each fully prepared item, save exact head, substantive review, repair/proof
results, required checks, risk/ownership verdict, session and next action. Refresh
live state and head immediately before publication; merged/closed/draft/changed
items cannot remain ready. Preserve observed external merges separately.

Mark the package `awaiting-signoff`, claim it, and hand it to the operator. A
scheduled run never invokes merge, enables auto-merge, submits an approving
review, releases, or deploys. This gate is indefinite. A dashboard entry, standing
queue request, full access, prior date, or previous batch approval is not signoff.

Only an explicit operator message approving this item for landing starts the
native landing workflow in its persistent session. Bind approval to the prepared
head; any subsequent code change requires renewed approval. Refresh state and
re-run required exact-head gates before landing. Record approval source, merge
SHA, actor and URL. Never count an external merge as a loop-performed merge.
