# Native OpenClaw contract

Inspect the installed runtime's schemas before mutation; these APIs evolve.
Use authenticated `openclaw gateway call METHOD --json --params JSON`, or the
operator's OCM environment wrapper. Never read or rewrite the live SQLite store
to emulate an API. Never restart a shared gateway merely to install a skill.

## Binding

Create a session with `sessions.create` using a stable explicit `key`, `agentId`,
`label`, `displayName` and idempotency key. Omit `task`/`message` to create an empty
session without launching work. Save the returned key and ID, and resolve its
actual Control UI route. Reuse it on every run and verify readback.

Create with `cron.add`; use a unique `declarationKey` or reconcile by stored job
ID rather than blindly adding duplicates. Required shape:

```json
{
  "name": "loop-example",
  "agentId": "work-agent",
  "enabled": false,
  "schedule": {"kind": "cron", "expr": "0 3 * * 1-5", "tz": "America/Los_Angeles", "staggerMs": 0},
  "sessionTarget": "session:loop-example",
  "sessionKey": "agent:work-agent:loop-example",
  "wakeMode": "now",
  "payload": {"kind": "agentTurn", "message": "Read the owning loop skill and run example.", "timeoutSeconds": 0, "toolsAllow": ["*"]},
  "delivery": {"mode": "none"},
  "failureAlert": false
}
```

`toolsAllow:["*"]` is appropriate only for an already authorized full-access
agent; otherwise scope tools to the workflow. The gateway authors scheduled tool
policy; do not forge it. Persistent-session scheduled turns require explicit tool
access for dashboard authoring. `timeoutSeconds:0` means no wall-clock deadline;
worker `runTimeoutSeconds` must also be zero. Tool observation timeouts are not
run deadlines. Do not cancel healthy workers to synthesize a report.

Use `cron.update` with the last read `expectedConfigRevision` when supported.
Preserve existing schedule anchors when updating interval jobs. `cron.run` starts
the native path; `cron.runs` supplies scheduler outcomes. An `ok` scheduler result
does not prove source coverage, item completion, or dashboard delivery.

## Reporting

`board.widget.put` accepts `sessionKey`, stable `name`, `title`, and
`content:{kind:"plugin",pluginKind:"session:report",props:REPORT}`. Read back with
`board.get`. The equivalent agent tools are `dashboard` with `widget_put` and
`show_widget` with a report and `pin:true`. Do not request a connected presentation
target in a headless run. Reports are read-only; no action/merge/pause controls.

Reports contain `blocks` (text, metrics, links, tables or charts); the title belongs
to the widget, not the report props.
The runtime currently caps props at 8 KiB and reports at 24 blocks. Split the
complete item index across stable widgets; never silently drop items to fit.
Remove obsolete pages only after every replacement has been persisted. A report
must distinguish observed external merges from merges performed by this loop.

Export a redacted trajectory with the supported CLI before session retention:

```sh
openclaw sessions export-trajectory --session-key "$SESSION_KEY" --agent "$AGENT_ID" --workspace "$WORKSPACE" --output "$UNIQUE_EXPORT_NAME" --json
```

Keep the returned bundle and its files with the run evidence, including worker
exports. A persistent session export may contain earlier runs: retain run start,
end, session IDs and native task IDs to select the correct interval. The final
publication call may fall after the export; keep its separate readback receipt.
Do not call an incomplete or truncated history read a full trace. Record export
failure as an evidence gap. Backup archives are not a substitute for a tested
retention path or versioned improvement history.
