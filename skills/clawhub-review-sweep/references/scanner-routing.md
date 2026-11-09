# Scanner accuracy routing in existing GitHub gardening

This reference supplements the existing ClawHub gardening/review workflow; it
creates no skill, schedule, notification lane, or scanner implementation work.
For false-positive/judgment routing it supersedes the narrower manual-clear-only
classification and exact-comment template in `clawscan-policy.md`. Keep that
upstream reference intact as provenance. Other action/authority gates remain.

## Classify the request, not the label

Route requests disputing scanner detections, evidence interpretation, incomplete
inspection judgments, or the Review/suspicious badge to
https://github.com/openclaw/clawscan. This includes requests for human re-review,
allowlisting, clearing, overriding, or reclassifying an individual verdict.
A defensive purpose, zero static findings, or another version's review does not
establish that the submitted artifact is clean.

Do not use this route to dismiss stuck scans, queue/publish failures, wrong
artifact/version associations, stale UI/API state, ClawHub integration defects,
account bans, moderation holds, abuse, or ownership disputes. For mixed reports,
separate the accuracy request from concrete operational evidence; retain or link
the actionable ClawHub part rather than declaring it fixed. A reported hold is
not established merely by a scanner score or badge, but do not dismiss an actual
publication-check/error or moderation reason.

## Existing gardener's ClawScan repository checks

In the same gardening invocation, read the current ClawScan contribution and
security-reporting guidance, enumerate all open issues and PRs across pages,
and inspect relevant existing discussions/PRs before recommending an upstream
report. Keep repository + kind + number in every identity; do not confuse equal
numbers across repositories. Link an established matching report instead of
claiming a new one was filed. Refresh any candidate's current state/discussion.

When the invocation has a frozen reporting window, also enumerate all states of
ClawScan issues/PRs created in that same `[windowStart, windowEnd)` interval.
REST issues includes PRs; `since` filters updates, so paginate then filter
`created_at` explicitly. Return source-specific coverage and the complete
linked ClawScan window index to the existing parent/report, including closed or
externally merged items. Do not replace the required complete ClawHub index or
create another report. Access failures or capped/partial results are coverage
gaps, not an empty or healthy repository. Keep evidence in existing native task
or canonical issue records; add no registry, marker, scheduler or ledger.

These ClawScan checks are read-only. They do not authorize scanner code changes,
PR publication/landing, deployments, upstream issue creation, or judgment overrides.

## Courteous reply and closeout

Public correspondence/closure requires the current operator's explicit or
applicable standing triage authority; this document alone grants none. Under an
authorized reply-and-close route, close the ClawHub scanner-judgment request
after replying. Review-only/discovery modes remain read-only.

1. Read the latest issue body and all comments before **each** public write,
   including the close after posting. Reassess changed scope, active owners,
   holds, or new operational evidence; do not blindly reuse stale approval.
2. Thank the reporter and reference the latest affected version, not just the
   original issue version. Attribute assertions and reviews to their authors;
   do not edit others' comments or present publisher analysis as staff clearance.
3. Link https://github.com/openclaw/clawscan and invite version-bound evidence:
   ClawHub URL, version, artifact fingerprint/component hashes, scan time,
   complete redacted scanner reports, final verdict and available scanner/runtime
   revision, disputed findings, expected vs observed behavior and a reproducer.
   Encourage a proposed general fix and regression-test PR. Preserve original
   report links/attribution. Do not require secrets or raw sensitive payloads;
   route vulnerabilities through the repository's private security channel.
4. Distinguish advisory scanner scores/warnings, the final ClawScan verdict, and
   actual publication/moderation state. Verify the current source contract before
   explaining it. A security publication check passing with retained suspicious
   findings is not a clean-artifact verdict or proof that publication succeeded;
   missing evidence remains unknown. Ask for the exact check/error or hold reason
   for any concrete ClawHub publication problem.
5. Explain that ClawHub does not manually clear or override individual scanner
   verdicts, and closure routes the judgment question upstream rather than
   approving an artifact or fixing a publication hold. Explicitly supersede
   earlier automated keep-open/manual-review guidance when needed. Never tune
   findings to satisfy the complaint or promise an allowlist/clearance/rescan.
6. Post one attributed reply; freshly re-read the issue/comments, then close
   with a routing/not-planned reason, not fixed/completed. Preserve unrelated
   labels and comments. Reconcile uncertain effects before retrying. Read back
   the exact comment and closed state, actor and timestamp; return those URLs
   and receipts privately through the existing parent/reporting contract.

No unsolicited Slack post or mention is authorized by this routing procedure.
