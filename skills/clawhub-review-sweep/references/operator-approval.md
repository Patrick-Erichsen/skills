# Operator approval gate

The private ledger separates review from action.

## Before Patrick reviews the ledger

Allowed:

- Read GitHub, repository source, CI, and public linked evidence.
- Read `clawhub-admin` help and use non-mutating status/list commands when safe.
- Create or update private ledger records and run summaries.
- Present recommendations privately.

Not allowed:

- GitHub comments, reviews, labels, closes, merges, pushes, or author feedback.
- ClawHub moderation, admin mutation, staff email, deploy, release, or production-data changes.
- Asking ClawSweeper or another public bot to act.

## Approval identity

- PR approval is bound to repository, PR number, exact head SHA, current source fingerprint, immutable review revision, and named action.
- Issue approval is bound to repository, issue number, current source fingerprint, immutable review revision, and named action.
- Admin approval is bound to the exact target, command family, intended mutation, and evidence recorded in the ledger.

Changed targets return to review. Refresh the complete source surface immediately before execution and reject the approval when the current fingerprint or review revision differs, even if the PR head is unchanged. Do not infer approval from a request to inventory, review, summarize, or propose.

## Batch safety

Serialize external writes. Never close more than five items in one batch without Patrick confirming the exact target list. Record every executed action in the item record and append-only run record.
