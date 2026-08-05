# ClawHub admin capability map

Refresh this map from `bun run admin -- --help` and the relevant nested `--help` before recommending an action. The CLI is authoritative; this reference is routing guidance.

## Current command families

| Request class | Command family | Examples |
| --- | --- | --- |
| User bans and account recovery | `users` | ban, unban, lift moderation hold, set role, reclassify ban, recover publisher |
| Plugin/package moderation and repair | `plugins` / `packages` | moderation status/queue, moderate, feature, unfeature, reports, triage report, hard delete, transfer, repair name/runtime id, migrations, trusted publisher |
| Org publishers | `org` | official publishers, create, remove member, delete, reclaim, repair scoped packages |
| Publisher status | `publisher` | official publishers |
| Guarded staff email | `email` | send after explicit sign-off |
| Content-rights cases | `content-rights` | get case, record correspondence |
| Skill artifact moderation | `skills` | feature, unfeature, hard delete, revoke version, unhide, rescan, bulk rescan, repair stale VirusTotal pending state, reports, triage report |
| Promotions | `promotions` | list, create, update, set status |

## Classification

- `exact-command`: the requested outcome and target map directly to one supported command.
- `partial-command`: the CLI can perform part of the request but investigation, evidence, or a separate owner action is required.
- `unsupported`: no current command implements the requested outcome.
- `none`: the item is not an admin request.

For exact commands, record a non-mutating status/list command when one exists, the mutation template, required target qualification, rollback/recovery expectations, and recommendation. Do not execute during review-only mode.

Scanner distinction: `skills rescan` queues a new scan; it does not clear or override a ClawScan verdict. Do not map manual finding-remediation requests to `rescan` unless a new scan of a new or corrected artifact is independently justified.
