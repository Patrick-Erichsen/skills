# Durable review record

Keep one JSON file per GitHub item. Issues and pull requests use separate directories because GitHub can assign the same number to both kinds.

## Required shape

```json
{
  "schemaVersion": 1,
  "repository": "openclaw/clawhub",
  "kind": "issue",
  "number": 123,
  "url": "https://github.com/openclaw/clawhub/issues/123",
  "fingerprint": "sha256:...",
  "source": {},
  "review": {
    "status": "complete",
    "revision": "sha256:...",
    "reviewedAt": "2026-08-05T00:00:00Z",
    "reviewedFingerprint": "sha256:...",
    "summary": "One-paragraph current-state summary.",
    "priority": "p0|p1|p2|p3|p4",
    "verdict": "actionable",
    "confidence": "high|medium|low",
    "blockedReason": null,
    "evidence": ["Specific source or repository evidence"],
    "proposedActions": [
      {
        "type": "comment|close|review|merge|repair|admin-command|investigate|none",
        "targetFingerprint": "sha256:...",
        "summary": "Exact proposed action",
        "public": false,
        "approvalStatus": "awaiting-patrick-review"
      }
    ],
    "adminCapability": {
      "classification": "none|exact-command|partial-command|unsupported",
      "commandFamily": null,
      "readCommand": null,
      "mutationTemplate": null,
      "requiredEvidence": [],
      "recommendation": "approve|deny|needs-judgment|not-applicable"
    },
    "clawscan": {
      "classification": "not-related|manual-finding-remediation|scanner-operation|integration-bug|moderation-or-abuse",
      "closureComment": null
    }
  },
  "actions": [],
  "reviewHistory": [],
  "history": []
}
```

For PRs, `source` must include the exact `headRefOid`, all changed files, complete checks, mergeability, review decision, general discussion, submitted reviews, and inline review threads/comments. For issues, it must include body, complete discussion, labels, and material update timestamps. The sync paginates nested REST evidence when the GraphQL summary is truncated.

Verdicts use the maintained enum in `scripts/review-schema.mjs`; add a reusable category there rather than accepting arbitrary strings.

## Freshness

The sync script calculates a deterministic fingerprint from the fetched review surface. A changed PR head always invalidates the old review. New issue discussion, body/title changes, labels, or other material source changes invalidate an issue review. A previous review is retained in `history`; never overwrite the record of what was known at the old fingerprint.

Every batch review update must include the exact current `fingerprint`; omitted or stale fingerprints are rejected. A record with truncated comments, files, reviews, or check contexts cannot validate as `complete`. Fetch the missing evidence separately and extend the record, or mark the review `blocked` with the exact missing evidence.

The batch script computes `review.revision` from the complete substantive review, proposed actions, admin classification, and ClawScan classification. It excludes only the observation timestamp. Revisions replaced at the same source fingerprint are retained in `reviewHistory`. Approval and execution must match the current source fingerprint and immutable review revision; a revised recommendation invalidates the old approval even when GitHub has not changed.

The batch script derives each action's `public` safety flag from its type. `investigate` and `none` are private/read-only; comment, close, review, merge, repair, and admin-command actions always require the external-action approval path.

An unchanged fingerprint preserves a completed review. PR fingerprints exclude top-level `updatedAt` because the sync fetches complete discussion, reviews, inline threads, labels, files, and checks. Issue fingerprints conservatively include `updatedAt` until timeline/cross-reference/project events are fetched as a complete connection; bot-only churn may therefore require a quick no-material-change re-review.

For `status: blocked`, set `blockedReason` to the precise unavailable evidence or unresolved precondition. Complete reviews use `blockedReason: null`.

## Review quality

- `source` is evidence, not the verdict.
- A review must state the best next action, not only summarize the request.
- Use direct links or file paths in `evidence` when available.
- Never claim a PR is correct or merge-ready from metadata alone.
- `blocked` is not a catch-all. Name the exact unavailable evidence and the next step to obtain it.
