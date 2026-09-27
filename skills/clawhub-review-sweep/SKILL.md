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

## Purpose

Maintain a complete private review ledger for every open issue and pull request in `openclaw/clawhub`. Each run must enumerate the whole live open set, create records for missing items, re-review changed items, preserve unchanged reviews, and summarize everything newly opened or materially updated since the prior successful run.

The ledger is a private decision surface. An inventory or review request stays read-only. Patrick's September 25, 2026 ClawHub agreement also authorizes bounded repair, proof, merge, and evidence-backed issue closeout without another per-PR approval when the task calls for landing or backlog reduction and the work qualifies below. This authority applies to Patrick's ClawHub work, not other users or repositories. A named `human-review-loop` run remains manual; use [its reference](references/human-review-loop.md) when that mode is requested.

Unlike the OpenClaw PR sweep, ClawHub does not categorically exclude authorization, publication, dependencies, CI, or maintainer-authored work. The established behavior and the final evidence decide eligibility.

Read before use:

- [references/review-record.md](references/review-record.md) for the durable schema and freshness rules.
- [references/operator-approval.md](references/operator-approval.md) for the autoland and human-decision gates.
- [references/admin-capabilities.md](references/admin-capabilities.md) before classifying admin requests.
- [references/clawscan-policy.md](references/clawscan-policy.md) before classifying any scanner-related item.

Compose the repository-local `clawhub-pr-maintainer` and `clawhub-moderation` skills. Use `autoreview` when a PR advances to repair or landing. Admin mutations must use `clawhub-admin`; never call Convex mutations directly.

## Agreed autoland boundary

- Qualify an issue or PR when a bounded fix restores an established contract or performs compatible maintenance. Establish that contract from accepted intent, current source/specs, or demonstrated supported behavior. Preserve Patrick's explicit decisions; for example, deleting comments does not authorize restoring the old comments query.
- Eligible surfaces include existing authorization and publication checks, current-owner access, resource cleanup, catalog/API/UI/docs/performance corrections, compatible dependency updates, CI repairs, and generated guidance. An issue may need a new PR. Security sensitivity increases the proof required; it is not a categorical veto.
- Other maintainers' work can qualify. Respect drafts, explicit holds, active ownership, unresolved review threads, canonical work, and contributor branch permissions. A past maintainer comment alone is not a veto.
- Escalate new product behavior, integrations, trust/scanner policy, ownership or identity decisions, major migrations, new permission or secret-handling policy, release policy, or a newly chosen compatibility/availability limit. If a repair cannot preserve supported behavior without making one of those choices, stop that candidate and present the specific decision.
- Deployments, releases, account or artifact moderation, admin commands, email, and other production operations need their own task authorization. The standing autoland agreement does not supply it.

Eligibility authorizes doing the engineering work. It is not a merge-ready verdict. Show actual before/after behavior from the changed system where appropriate, including legitimate success and relevant denial or negative controls. Review the final revision, account for current `main`, run required checks, address actionable findings, and refresh the live head and discussion before landing. A changed head requires renewed qualification; it does not require another Patrick approval if the result remains within this agreed boundary. Record the contract, qualification evidence, and action route in the ledger as described in [references/review-record.md](references/review-record.md).

Do local repairs under `autoland-candidate`. Present comparable proof before pushing a repair branch or handing it off; move the action to `autoland-qualified` after validation. Public GitHub changes use the qualified route and the final live checks.

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
- `mode`: `review-only` for inventory/review requests; `autoland` when the task asks to fix or land eligible ClawHub backlog work; `execute-approved` for a named human-approved action; `human-review-loop` for explicitly requested manual preparation.
- `since`: default `state.json.lastSuccessfulRunAt`.
- `provided_items`: optional issue or PR URLs to highlight without excluding the rest of the open set.

## Outputs

- One current durable review record for every open issue and PR.
- A complete new/changed-item summary for the Daily Brief window.
- Proposed actions separated from executed actions.
- Exact-head PR freshness and material issue-update freshness.
- Admin-command and ClawScan classifications with evidence.
- An append-only run record and validated open-set counts.
