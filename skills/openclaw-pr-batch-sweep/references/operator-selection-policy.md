# Operator Selection Policy

Use this policy for Patrick's OpenClaw contributor PR batches. Metadata ranking is only a rejection aid; live qualification decides whether a PR belongs in the batch.

## Eligible Work

Do not reject a PR merely because it is small or touches UI or docs.

- Micro-PRs may qualify when the behavior, contract, or correction is concrete and the proof is proportional.
- Control UI, web UI, TUI, native UI, visual, translation, and frontend fixes may qualify. Require browser, screenshot, interaction, or focused automated proof appropriate to the change.
- Docs-only changes may qualify. Verify statements against current source, commands, schemas, upstream contracts, and links as applicable.
- Diagnostic wording may qualify when the new result is more actionable or correct and the affected failure path is proven.

Small does not mean automatically good. Cleanup, typo, wording, or mechanical changes still need enough value to justify review, but line count is never the deciding gate.

## Hard Rejects

Reject before assigning an implementation lane:

- Draft PRs or current maintainer-authored/labeled queue work.
- Explicitly skipped, terminally handled, already rejected, closed, merged, or superseded PRs.
- Security, SSRF, proxy, outbound request policy, auth, OAuth, token, secret, credential, redaction, permission, sandbox, pairing, trust-boundary, or sensitive-data changes.
- Config schema/default changes, migrations, legacy compatibility, provider/auth routing, public plugin SDK/API, protocol versioning, release, CI/workflow, dependency, or infrastructure policy.
- Service environment, dotenv loading, daemon PATH construction, executable precedence, or self-update install-root selection.
- Session/transcript persistence, replay, deduplication, identity, recovery, or delivery semantics.
- Availability-policy changes to watchdog duration, retry/fallback policy, slot occupancy, forced termination, or duplicate execution behavior.
- Features, new knobs, new integrations, broad refactors, owner-boundary moves, or changes needing a product decision.
- Test-only, coverage-only, generated-only, snapshot-only, or formatting-only work without a demonstrated maintainer or product outcome.
- Dirty branches, unrelated churn, duplicate implementations, fixed-on-main work, or weaker duplicates of an existing canonical PR.
- Bundled multi-topic PRs that cross independent lifecycle, channel, or owner paths.
- Work whose real proof requires unavailable credentials or an unbounded live environment.
- Changes that expand during review into terminal sanitization, untrusted-input auditing, permission changes, or another security boundary.

## Still Configurable

These remain excluded until Patrick explicitly changes them:

- Maintainer-authored work.
- Security/auth/trust-boundary work.
- Config, migration, compatibility, protocol, SDK, dependency, release, workflow, and infrastructure-policy changes.
- Session/message-delivery semantics and availability policy.
- New features, integrations, broad refactors, and product decisions.
- Test-only or generated-only work.
- Bundled-skill expansion and other optional core expansion better owned by plugins or ClawHub.
- Large changes above roughly 500 production lines or 12 files.

## Qualification Gate

Before qualification, state:

- Who benefits and what becomes correct, clearer, or usable.
- The owning path and concrete outcome.
- Failing-before behavior, source/dependency contract, visual evidence, or docs mismatch.
- Why the proposed change is the best owner-boundary fix.
- The proportional proof required for this kind of change.

Reject vague or speculative value claims. ClawSweeper rank is a useful signal, never an override.

## Preferred Shape

Prefer:

- One clear owner path.
- A focused regression test, deterministic behavior proof, visual proof, or source-backed docs validation.
- Current-main reproducibility or direct contract evidence.
- A canonical fix that replaces faulty behavior instead of adding a parallel path.
- An editable contributor branch or a clean credited replacement path.

Large production changes above 500 lines or more than 12 files require explicit operator selection after review.

## Readiness Signals

Rank higher with:

1. ClawSweeper diamond or platinum.
2. `proof: sufficient`.
3. `ready for maintainer look`.
4. Live mergeability and relevant green checks.
5. A focused changed-file surface.

Downgrade or reject `needs proof`, `waiting on author`, dirty/conflicting or stale heads, exact hard-risk labels, missing context, unexplained generated changes, or repeated proof-refresh commits.

GitHub `UNSTABLE` is a downgrade rather than an automatic rejection when the latest hydrated non-routine checks have no failure or pending state. Landing still requires exact-head green proof.

## Vision Wash

Prefer fixes and improvements that advance OpenClaw's operator experience, stability, setup, first-run reliability, provider/channel correctness, UI usability, documentation correctness, and performance.

Reject optional core expansion, bundled-skill expansion, duplicate MCP/agent infrastructure, wrapper channels, commercial integrations, heavy orchestration, or work better owned by a plugin or ClawHub unless Patrick explicitly expands the batch.

## Batch Rule

`20` means at most 20 qualified work items, never 20 sampled PRs. Do not pad. Continue the durable handled set across later batch requests.
