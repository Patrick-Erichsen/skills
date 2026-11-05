# OpenClaw publishing adapter

Use only tools and actions advertised by the current runtime. This adapter carries
no host, account, session, widget or schedule identifiers; use observed values from
the authorized conversation and saved job.

## Native report

1. Read the current board with `dashboard(action: "read")`. Find the existing
   brief's stable name, tab, content owner and report type. If no brief exists,
   create one only when the user requested a persistent dashboard.
2. Use `show_widget` with `pin: true`, the same `name` and `tab`, and
   `report: {blocks: [...]} `. Omit `widget_code`, `kind`, capabilities and
   presentation targets for a native report. Never silently convert its owner.
3. Use text blocks for date/count, Highlights and Still open. Native text is not
   guaranteed to parse Markdown: use literal • bullets separated by blank lines.
   Use a short text footer and optionally a links block with 2–3 selected PRs.
   Do not add metrics blocks or the complete PR index.
4. Respect the current tool schema's size/block/link limits. Read the board again
   and compare the saved report and unrelated widgets. A pinned receipt proves
   persistence, not browser rendering; do not claim visual inspection from it.

## Recurring format

Read the existing automation by its observed ID; update only the payload's
formatting instructions and the referenced procedure. Preserve schedule, timezone,
enabled state, session target, delivery and allowed tools. If it is not visible,
report that limitation rather than recreating it. Merely reading a brief does not
authorize schedule creation or modification.

Keep deployment-specific paths and IDs in the local procedure, not this public
skill. For overnight runs, do not focus the dashboard or navigate the user's UI.
The scheduler owns final delivery; return the brief rather than calling a separate
message send. Verify updates through the automation and dashboard tools.
