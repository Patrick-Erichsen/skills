---
name: clawhub-review-sweep
description: Review and durably track every open ClawHub GitHub issue and pull request in a private ledger, summarize new or changed items for the Daily Brief, identify admin-CLI requests, and gate all public actions on Patrick's approval.
license: MIT
metadata:
  source: "https://github.com/Patrick-Erichsen/skills/tree/main/skills/clawhub-review-sweep"
  version: "0.1.0"
  spec: agentskills-v1
---

# ClawHub review sweep

## Purpose

Maintain a complete private review ledger for every open issue and pull request in `openclaw/clawhub`. Each run must enumerate the whole live open set, create records for missing items, re-review changed items, preserve unchanged reviews, and summarize everything newly opened or materially updated since the prior successful run.

The ledger is a private decision surface. Discovery and review are read-only. Do not comment, review, label, close, merge, push, moderate, email, deploy, or mutate production until Patrick has inspected the proposed actions and approved exact targets.

This skill is modeled on the proposal and exact-head approval boundary in `openclaw-pr-batch-sweep`, but it is exhaustive rather than candidate-ranked and covers issues and PRs as distinct record kinds.

Read before use:

- [references/review-record.md](references/review-record.md) for the durable schema and freshness rules.
- [references/operator-approval.md](references/operator-approval.md) for the action gate.
- [references/admin-capabilities.md](references/admin-capabilities.md) before classifying admin requests.
- [references/clawscan-policy.md](references/clawscan-policy.md) before classifying any scanner-related item.

Compose the repository-local `clawhub-pr-maintainer` and `clawhub-moderation` skills. Use `autoreview` when an approved PR advances to repair or landing. Admin mutations must use `clawhub-admin`; never call Convex mutations directly.

## Canonical state

Use the private `Patrick-Erichsen/clawhub-review-state` repository as the only durable ledger. Clone or refresh it in a task-owned isolated checkout. Do not store private review records in the public ClawHub or skills repositories.

The state repository contains:

- `reviews/issues/<number>.json`
- `reviews/pulls/<number>.json`
- `runs/<utc-timestamp>.json`
- `state.json`
- `README.md`

## Workflow

1. Recover state and establish the review window.
   - Refresh `openclaw/clawhub`, the private state repository, and GitHub live state.
   - Read `state.json.lastSuccessfulRunAt`. The first run has no time floor; later Daily Brief runs use the prior successful run.
   - Keep dirty shared checkouts read-only. Use task-owned clones or isolated worktrees.

2. Enumerate the entire live open set.
   - Fetch every open issue and every open PR, with no first-page or priority cutoff.
   - Keep issue and PR identities distinct even when they share a number.
   - Run `node scripts/sync-open-items.mjs --state <state-checkout>` from this skill directory.
   - The sync creates missing records, marks materially changed records `needs-review`, preserves unchanged completed reviews, and reports records whose items are no longer open. It performs no public mutation.

3. Review every missing or changed record.
   - Issues: read the body, all available discussion, labels, linked work, duplicates, current repo behavior when relevant, and whether the request is still actionable.
   - PRs: review the exact head SHA, changed files, issue/context, discussion/reviews, checks, mergeability, relevant implementation and tests, duplicate/fixed-on-main state, and best-fix shape. Metadata screening is not code-review proof.
   - Write concise evidence, summary, priority, verdict, confidence, and proposed actions into the record described by `references/review-record.md`.
   - For a prepared JSON batch, include each record's current `fingerprint` and use `node scripts/apply-review-batch.mjs --state <state-checkout> --input <reviews.json>`; it requires an exact match and binds every proposed action to that fingerprint.
   - Mark `review.status` as `complete` only after the substantive review appropriate to that item. Use `blocked` with a precise missing evidence field when review genuinely cannot be completed.
   - Never silently omit a low-priority item. Every currently open item must have a current record.

4. Classify special handling.
   - For a request that exactly maps to an existing `clawhub-admin` command, record the command family, exact dry-run/read command when available, mutation command template, required evidence, risk, and an `approve`, `deny`, or `needs-judgment` recommendation. Do not execute it.
   - For ClawScan finding-remediation requests, apply `references/clawscan-policy.md`. Propose the standard closure comment only for manual clear/override/reclassification requests.
   - Do not treat a stuck scan, stale result, wrong artifact/version, publish failure, ban, abuse report, or integration defect as a manual-remediation request.

5. Present the private review surface and stop.
   - Validate with `node scripts/validate-state.mjs --state <state-checkout>`.
   - Commit and push the private ledger so Patrick can inspect stable URLs and diffs.
   - Present counts for all open issues and PRs, missing/changed/unchanged reviews, priorities, proposed actions, admin-command candidates, ClawScan closure candidates, and blocked reviews.
   - Stop before public action. Approval must name exact issue source fingerprints or exact PR head SHAs plus source fingerprints, immutable review revisions, and the authorized action.

6. Execute only approved actions.
   - Refresh live state immediately before acting.
   - If a PR head, source fingerprint, or immutable review revision changed, supersede the approval and return the refreshed record for review.
   - If an issue materially changed, refresh its record and return it for approval.
   - Serialize public comments, closes, labels, pushes, merges, moderation, and admin commands.
   - Never close more than five items in one batch without Patrick confirming the exact target list.
   - Record the action, actor, timestamp, live target fingerprint, command or comment, and resulting URL/SHA in the private record.

7. Close the run.
   - Write an append-only run record with the complete open-set counts, review outcomes, proposed actions, approved/executed actions, failures, and source freshness.
   - Advance `state.json.lastSuccessfulRunAt` only after every open item has a current complete or explicitly blocked review and the run record is pushed.
   - For the Daily Brief, summarize every newly opened or materially updated open item, then prioritize urgent blockers and a small backlog shortlist. The full private ledger remains authoritative.

## Inputs

- `repo`: default `openclaw/clawhub`.
- `state_repo`: default `Patrick-Erichsen/clawhub-review-state`.
- `mode`: `review-only` by default; `execute-approved` only after explicit approval.
- `since`: default `state.json.lastSuccessfulRunAt`.
- `provided_items`: optional issue or PR URLs to highlight without excluding the rest of the open set.

## Outputs

- One current durable review record for every open issue and PR.
- A complete new/changed-item summary for the Daily Brief window.
- Proposed actions separated from executed actions.
- Exact-head PR freshness and material issue-update freshness.
- Admin-command and ClawScan classifications with evidence.
- An append-only run record and validated open-set counts.
