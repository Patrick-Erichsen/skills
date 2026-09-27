# Action authorization

The private ledger separates review from action. Patrick's September 25, 2026 agreement covers bounded ClawHub contract repairs and compatible maintenance, including proof, merging, and evidence-backed fixed/duplicate closeout. It does not authorize a new product, trust, ownership, or compatibility decision. Use the main skill's autoland boundary before recording an action under this agreement.

## Read-only review

Allowed:

- Read GitHub, repository source, CI, and public linked evidence.
- Read `clawhub-admin` help and use non-mutating status/list commands when safe.
- Create or update private ledger records and run summaries.
- Present recommendations privately.

Without an autoland task or a named human-approved action, do not perform:

- GitHub comments, reviews, labels, closes, merges, pushes, or author feedback.
- ClawHub moderation, admin mutation, staff email, deploy, release, or production-data changes.
- Asking ClawSweeper or another public bot to act.

## Autoland route

An `autoland-candidate` action may be a `repair` only. Record the exact established contract and source evidence showing the bounded fix needs no new decision. It permits local diagnosis and repair; do not push the branch or publish the work yet. Produce comparable proof and validation, then publish a new qualified review revision before GitHub push, landing, or closeout.

An `autoland-qualified` action may be a `repair`, `merge`, proof/completion `comment`, or evidence-backed fixed/duplicate `close`. Its record must name the contract, eligibility evidence, before/after or equivalent baseline evidence, and completed validation. A qualified ledger entry is still subject to fresh live checks: final head and discussion, ownership/holds, current-main integration, actionable review findings, and required repository gates. Requalify after material source or review changes; a new Patrick approval is needed only if the work crosses the agreed boundary.

No standing autoland route exists for public PR reviews/approvals, labels, admin commands, moderation, deployment, release, email, or production-data operations. A review-only request remains read-only even if the candidate would otherwise qualify.

## Human decision route

For work outside the boundary or a task explicitly using the human-gated mode, bind Patrick's approval as follows:

- PR approval is bound to repository, PR number, exact head SHA, current source fingerprint, immutable review revision, and named action.
- Issue approval is bound to repository, issue number, current source fingerprint, immutable review revision, and named action.
- Admin approval is bound to the exact target, command family, intended mutation, and evidence recorded in the ledger.

Changed targets return to review. Refresh the complete source surface immediately before execution and reject the human approval when the current fingerprint or review revision differs, even if the PR head is unchanged. Do not infer approval from a request to inventory, review, summarize, or propose.

## Batch safety

Serialize external writes. Close at most five issues in a tranche, refresh and requalify before another tranche, and record every executed action in the item record and append-only run record. Human-gated actions still need exact-target approval; qualified autoland actions do not need another per-tranche confirmation.
