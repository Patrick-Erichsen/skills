---
name: clawhub-review-sweep
description: Review and durably track every open ClawHub issue and pull request, qualify bounded fixes for the agreed autoland policy, and route decisions to Patrick.
license: MIT
metadata:
  source: "https://github.com/Patrick-Erichsen/skills/tree/main/skills/clawhub-review-sweep"
  version: "0.2.0"
  spec: agentskills-v1
---

# ClawHub review sweep

## Factory modes

For Software Factory, read the private `loops/clawhub.md` definition.

- **discovery:** enumerate the complete open issue/PR set and maintain source
  fingerprints. Apply the private prioritized selection rule; create/reuse
  canonical Linear work with source run, evidence, intended outcome and authority.
  Stop after queue/ledger/coverage readback. Do not perform substantive delivery
  review, fixes, public actions, merges, moderation or deployments.
- **factory-item:** use review/qualification and ledger mechanics for the single
  assigned item under its factory ownership and permission record. Do not start
  another sweep or competing coordinator. Return proof and disposition to the
  existing Linear owner. Preserve named human-review restrictions.

A discovery inventory does not mark every item substantively reviewed or advance
lastSuccessfulRunAt as though a full review sweep completed; retain a separate
source inventory receipt/cursor using the ledger's supported extension points.

## Purpose

Maintain a complete private review ledger for every open issue and pull request in `openclaw/clawhub`. Each run must enumerate the whole live open set, create records for missing items, re-review changed items, preserve unchanged reviews, and summarize everything newly opened or materially updated since the prior successful run.

The ledger is a private decision surface. Inventory/review requests authorize source bookkeeping, not public action. Read the supplied operator policy for permitted repairs or landing. A named human-review-loop retains its human gate; use its reference when requested.

Unlike the OpenClaw PR sweep, ClawHub does not categorically exclude authorization, publication, dependencies, CI, or maintainer-authored work. The established behavior and the final evidence decide eligibility.

Read before use:

- [references/review-record.md](references/review-record.md) for the durable schema and freshness rules.
- [references/operator-approval.md](references/operator-approval.md) for the autoland and human-decision gates.
- [references/admin-capabilities.md](references/admin-capabilities.md) before classifying admin requests.
- [references/clawscan-policy.md](references/clawscan-policy.md) before classifying any scanner-related item.

Compose the repository-local `clawhub-pr-maintainer` and `clawhub-moderation` skills. Use `autoreview` when a PR advances to repair or landing. Admin mutations must use `clawhub-admin`; never call Convex mutations directly.

## Action boundaries

Read the task's operator policy and [authorization mechanics](references/operator-approval.md).
Personal standing permissions live in the operator's private configuration.
Qualify the actual final revision with comparable proof, current-main context,
required checks, actionable-feedback resolution and fresh target state. Record
candidate versus qualified action separately; selection never means merge-ready.

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
   - Write concise evidence, summary, priority, verdict, confidence, and proposed actions into the record described by `references/review-record.md`. Mark each action as awaiting a human decision, an autoland repair candidate, or qualified for autoland. Do not equate eligibility with merge readiness.
   - For a prepared JSON batch, include each record's current `fingerprint` and use `node scripts/apply-review-batch.mjs --state <state-checkout> --input <reviews.json>`; it requires an exact match and binds every proposed action to that fingerprint.
   - Mark `review.status` as `complete` only after the substantive review appropriate to that item. Use `blocked` with a precise missing evidence field when review genuinely cannot be completed.
   - Never silently omit a low-priority item. Every currently open item must have a current record.

4. Classify special handling.
   - For a request that exactly maps to an existing `clawhub-admin` command, record the command family, exact dry-run/read command when available, mutation command template, required evidence, risk, and an `approve`, `deny`, or `needs-judgment` recommendation. Do not execute it.
   - For ClawScan finding-remediation requests, apply `references/clawscan-policy.md`. Propose the standard closure comment only for manual clear/override/reclassification requests.
   - Do not treat a stuck scan, stale result, wrong artifact/version, publish failure, ban, abuse report, or integration defect as a manual-remediation request.

5. Validate and present the private review surface.
   - Validate with `node scripts/validate-state.mjs --state <state-checkout>`.
   - Commit and push the private ledger so Patrick can inspect stable URLs and diffs.
   - Present counts for all open issues and PRs, missing/changed/unchanged reviews, priorities, proposed actions, admin-command candidates, ClawScan closure candidates, and blocked reviews.
   - In `review-only` mode, stop before public action. In `autoland` mode, advance only actions covered by the agreed policy; bring other decisions to Patrick. The named `human-review-loop` retains its manual signoff path.

6. Execute actions through their recorded route.
   - Refresh live state immediately before acting.
   - For human-approved actions, validate the exact approval identity in [references/operator-approval.md](references/operator-approval.md). For autoland actions, requalify the changed source and review revision within the standing policy. Never reuse stale proof.
   - Serialize public writes. Use small closeout tranches of up to five issues, rechecking current state between tranches; no extra per-tranche approval is needed for qualified actions.
   - Record the action, actor, timestamp, live target fingerprint, command or comment, and resulting URL/SHA in the private record.

7. Close the run.
   - Write an append-only run record with the complete open-set counts, review outcomes, proposed actions, approved/executed actions, failures, and source freshness.
   - Advance `state.json.lastSuccessfulRunAt` only after every open item has a current complete or explicitly blocked review and the run record is pushed.
   - For the Daily Brief, summarize every newly opened or materially updated open item, then prioritize urgent blockers and a small backlog shortlist. The full private ledger remains authoritative.

## Inputs

- `repo`: default `openclaw/clawhub`.
- `state_repo`: default `Patrick-Erichsen/clawhub-review-state`.
- `mode`: `discovery` or `factory-item` for the shared factory; `review-only` for inventory/review requests; `autoland` when the task asks to fix or land eligible ClawHub backlog work; `execute-approved` for a named human-approved action; `human-review-loop` for explicitly requested manual preparation.
- `since`: default `state.json.lastSuccessfulRunAt`.
- `provided_items`: optional issue or PR URLs to highlight without excluding the rest of the open set.

## Outputs

- One current durable review record for every open issue and PR.
- A complete new/changed-item summary for the Daily Brief window.
- Proposed actions separated from executed actions.
- Exact-head PR freshness and material issue-update freshness.
- Admin-command and ClawScan classifications with evidence.
- An append-only run record and validated open-set counts.
