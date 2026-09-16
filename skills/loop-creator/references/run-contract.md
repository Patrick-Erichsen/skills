# Run and report contract

## Run ownership

Use one private state root shared by cooperating loops. `begin` acquires a loop
lease with an atomic directory operation. If occupied, inspect its owner and
native task before resuming; elapsed time alone never releases ownership. Acquire
resource leases for shared writers/PR work and shared capacity slots before
dispatch. Native scheduling still decides when work runs. Never create a polling
daemon or a second scheduler. Keep all calls subject to repository CI/rate rules.

Freeze intake at run start. Save source cursors and instruction versions. Carry
blocked items explicitly; do not spin forever on unavailable sources. One normal
attempt and one materially different fallback can establish an evidence gap.
Unlimited runtime allows useful work to finish, not an infinite permanent-error
retry loop. Wait for every dispatched worker to settle through native task state.

## Receipt

Write a result JSON with these fields before running `seal`:

```json
{
  "loopId": "example",
  "runId": "returned-by-begin",
  "startedAt": "2026-01-01T03:00:00Z",
  "finishedAt": "2026-01-01T03:20:00Z",
  "status": "complete",
  "overview": "Two recurring problems explain most of today's reports. We focused on those and left routine dependency churn alone.",
  "ignored": "Routine churn had no new user impact.",
  "gaps": [],
  "workers": [],
  "traces": ["traces/coordinator/events.jsonl"],
  "items": [
    {"id": "finding-1", "status": "investigation", "summary": "Uploads fail before the request reaches the service; the issue has the reproduction.", "links": {"linear": "https://tracker.example/issue/1"}}
  ]
}
```

Statuses: `complete`, `degraded`, `failed`. Items: `awaiting-signoff`,
`merged-with-approval`, `merged-externally`, `investigation`, `decision`, `blocked`,
`skipped`, `closed`, `reading`, `local-review`. A review-ready PR requires `headSha`
and verified `pr`, `linear`, `session` links. `merged-with-approval` additionally
requires an explicit human `approvalUrl` and `mergeSha`; a label is not approval.
Scheduled scans never merge. The reporting helper cannot authorize a mutation.

Worker receipts include `taskId`, `sessionKey`, `status` and `evidencePath` to a
native terminal task snapshot. Reconcile that snapshot and exact expected IDs
against dispatch receipts before sealing. `seal` checks receipt structure, trace
existence/hashes, and live GitHub state/head for actionable PRs; it does not replace
repository proof, authenticate a claimed approval, or infer worker completion.

Keep traces under the run directory. Export real redacted native trajectories,
not prose reconstructed by the coordinator. If unavailable, use a degraded/failed
receipt with an explicit gap, never an invented trace. Store operational artifacts
privately; git source improvements and sanitized receipts, not raw transcripts.

## Dashboard

The overview is two or three plain sentences about themes, attention and omissions,
not an item-by-item recap or jargon-filled status preamble. Every item is a short
conversational explanation followed by clearly labeled links such as
`PR | Linear | Session`. All actionable findings have a tracker issue. Put raw
alerts, stack traces, calculations and detailed review evidence in that issue.
Preserve the complete output index; there is no three-item reporting cap.

Count distinct completed outcomes, not attempts or repeated prepared items from
prior runs. Show awaiting signoff, loop-landed and externally merged separately.
Publishing is retryable from the sealed receipt, and verified independently by
dashboard readback. Never change an immutable result to hide a publication error.
Refresh live PR state before every later re-publication; if it changed, write a
new reconciliation run rather than showing a merged PR as ready.
