# Human-gated ClawHub loop

Run steps 1-4 and the validated ledger closeout from the main skill for the entire
open issue/PR set. A 20-outcome preparation target never limits inventory coverage.
Then use the current repository-local `clawhub-pr-maintainer` and `autoreview`
workflow to prepare about 20 distinct eligible PRs for manual review per run.

Keep existing fingerprint-bound reviews, risk classifications and immutable
revisions. Do not import OpenClaw's commands or pretend its tests validate ClawHub.
Use the ClawHub repository's actual checks and shared CI/rate policy. Check
ownership through live assignees, explicit claims, unresolved review discussions,
active tasks and ledgers. An old maintainer comment alone does not exclude a PR;
active or uncertain ownership does. Respect shared capacity across all loops.

Focused repairs to eligible small, easy-to-review PRs are authorized before
signoff, using isolated worktrees and an editable contributor branch with verified
ownership/head. Preserve authorship, never overwrite external commits or replace
and close an uneditable contributor PR. Configuration, security/auth, migrations,
moderation/scanner policy, dependencies/CI infrastructure, availability and broad
design changes require human judgment, not autonomous repairs. An issue or admin
request is not a repair authorization. No moderation/production changes.

Create/reuse a dedicated persistent review session for each PR. Claim eligible
work through the native maintainer workflow. Record substantive review, exact
head, focused repair, tests/checks and next action in the ledger. Mirror verified
outcomes into the loop adapter's tracker and dashboard without creating a second
coordination ledger. Only fully prepared distinct outcomes count toward 20;
blocked, skipped or unchanged previously prepared items do not. Do not pad.

Refresh current state/head immediately before publishing. Ready items must still
be open, non-draft, and supported by exact-head checks. Merged items belong in
history, not the review queue. Show externally observed merges separately.

Stop at `awaiting-signoff`. Scheduled runs never merge, enable auto-merge, approve
reviews, deploy or release. Human-gated landing has no expiry. Only explicit
operator approval naming the prepared item/head can begin `execute-approved` in
its persistent session; preserve that mode's fingerprint/revision validation.
Any later code change requires renewed approval. Keep approval and merge receipts.
