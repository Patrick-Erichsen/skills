# Prepare-for-review mode

Use this mode only when the operator explicitly asks the system to winnow a larger pool into review-ready PRs without approving or landing them. It is a separate execution contract; standard and manifest proposal approval semantics remain unchanged.

## Authority boundary

The opt-in authorizes metadata screening, exact-head qualification, isolated reproduction, bounded task-owned repair, proof, and publication of maintainer-controlled PR branches. It does **not** authorize a submitted approval, merge, deployment, release action, contributor-branch mutation, public review/comment on the source contributor PR, or closure of any source PR or issue.

The coordinator remains the only GitHub mutator. Workers receive no mutation command or delegation. Apply every hard-risk, maintainer-participation, duplicate, fixed-on-main, owner-boundary, contributor-code isolation, and immutable-proof rule from the standard workflow. The maintainer-authored discovery exclusion still removes pre-existing maintainer queue work; the explicit mode authority permits only this run's own task-owned repair/replacement publication.

## Target and pool

- Set `review_ready_target` to the explicitly requested count, defaulting to 10 and never exceeding 10.
- Discover and hydrate a larger bounded pool using the standard new-then-backlog cursors and the existing 1000-open-PR inspection ceiling. Continue below noisy, excluded, disproven, or unrepairable candidates until the target is reached or the bounded pool is exhausted.
- Apply the latest-applicable-published-release priority from `operator-selection-policy.md` after hard exclusions. Do not pad the result or lower evidence, safety, ownership, or proof standards to reach the target.
- Operator-provided PRs or issues enter first but receive no policy exemption. Collapse issue/PR duplicates before allocating a lane.

## Mode ledger and exact heads

Create a mode-specific run manifest and per-item coordinator checkpoints in the sweep-state repository. Do not write `approved` to the standard `candidateQueue` and do not reinterpret a proposal as approval.

Freeze each source PR or issue evidence root before substantive work. For a source PR, record its exact head SHA. An external head change invalidates the lane; refresh, rescreen, and start a new checkpoint from the new head. Task-owned repair commits must descend from the frozen reviewed reconstruction, and every resulting head and tree hash must be recorded.

Use retained capacity from the standard scheduler: at most two qualification workers and at most two implementation workers. One worker owns one item at a time, and one worktree belongs to one item. Run contributor-controlled code only in Testbox/Crabbox under the standard worker contract.

## Winnow, repair, and prove

For each item:

1. Confirm user or operator impact, owner path, duplicate/fixed-on-main status, and release applicability. An alleged regression receives no freshness uplift until exact-release evidence confirms it.
2. Reproduce the behavior or establish direct source/dependency-contract proof. Reject speculative value, unsupported mechanisms, unavailable proof, or fixes that expand into a forbidden risk/product class.
3. Prefer an existing contributor PR when its exact head is already correct, focused, and fully proven. If repair is required, reconstruct from the frozen source head and publish a separate maintainer-controlled branch/PR; never push to the contributor branch. Preserve contributor credit and link the source PR or issue without exposing private state.
4. Narrow the diff to the canonical owner path, add proportional regression proof, run exact-head focused tests and relevant hosted CI, clear accepted actionable autoreview findings, and obtain an independent verifier verdict on the frozen final tree.
5. Keep construction PRs in draft. Mark a task-owned PR ready for review only after it satisfies the definition below. If the item cannot meet it within bounded repair/proof, record a concrete rejected, blocked, or carried outcome and continue winnowing.

## Review-ready definition

An item counts toward the target only when all of these are true:

- an open, non-draft contributor or task-owned PR exists at the recorded immutable head;
- the outcome, owner path, source attribution, and user impact are concrete and accurately described;
- hard-risk and maintainer-participation exclusions remain clear, with no unresolved duplicate or fixed-on-main result;
- the focused final diff has no unrelated churn and no accepted actionable autoreview finding;
- exact-head focused proof and all relevant required CI are green;
- mergeability and review-thread state are clean or explicitly proven non-blocking;
- the independent verifier confirms the final tree, proof package, and publication body;
- the checkpoint contains the PR URL, exact head/tree/diff hashes, proof commands or run IDs, CI and autoreview evidence, verifier result, and cleanup status.

A pending gate, infrastructure wait, draft PR, evidence uncertainty, or merely plausible metadata candidate does not count as review-ready.

## Stop boundary and result

After reaching the target or exhausting the bounded pool, stop before approval, merge, deployment, or release. Return:

- review-ready PR URLs and exact heads, separated into unchanged contributor PRs and task-owned repair/replacement PRs;
- the official release/channel context used for priority, including concrete tag/version and publication date;
- proof, CI, autoreview, independent-verifier, attribution, and cleanup evidence for each counted PR;
- rejected, blocked, carried, and exhausted-pool counts with concrete reasons;
- confirmation that no approval, merge, deployment, contributor-branch mutation, source-PR comment/closure, or risk override occurred.
