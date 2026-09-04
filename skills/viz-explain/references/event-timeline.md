# Event timeline and history

Use this explainer to reconstruct what happened across a real or hypothetical
interval. Events may share time without forming one request call chain.

Canonical scene: [event-timeline.excalidraw](../assets/scenes/event-timeline.excalidraw)

## Method

1. Choose a time range and the event whose outcome needs explanation.
2. Normalize timestamps and place all evidence on one axis.
3. Distinguish observed events, inferred intervals, and missing evidence.
4. Annotate duration only where it explains a delay, overlap, or timeout.
5. Group by participant or evidence source when several streams interleave.

## Worked OpenClaw example

Plot a scheduler firing at 09:00, isolated session creation, model and tool
activity, report persistence, Telegram announcement, and later operator
inspection. Alternate event cards above and below the axis so labels remain
readable while the time markers stay comparable.

For incident reconstruction, link each marker to a log, database row, or trace
and use a visibly different stroke for inferred events. For a teaching example,
relative offsets can replace absolute timestamps.

## Completion check

The ordering is evidence-grounded, gaps are visible, and elapsed time supports a
specific explanation rather than decorating the story.
