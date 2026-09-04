# Request and interaction sequence

Use this explainer to trace one causally connected runtime scenario. It answers
who exchanges what, and in what order; it is not a historical incident timeline.

Canonical scene: [request-sequence.excalidraw](../assets/scenes/request-sequence.excalidraw)

## Method

1. Pick one trigger and one terminal outcome.
2. Arrange participants across the top and let time move consistently downward
   or sideways.
3. Label every arrow with the meaningful payload or action. Add waits, retries,
   or asynchronous handoffs only when they change the explanation.
4. Attach code paths and evidence to the relevant interaction, not in a detached
   file list.
5. Collapse participants that never make an independent decision in this
   scenario.

## Worked OpenClaw example

Trace a Telegram message through six interactions: Telegram emits an update;
the channel adapter normalizes and routes it; the Gateway appends a session
turn; the agent runtime assembles context; the model may call tools; OpenClaw
formats and delivers the reply. Lifelines make the returning path and repeated
participants easy to scan.

For a debugging variant, add timestamps and color only the suspected boundary.
For an architecture explanation, keep timing secondary and annotate the owning
module beside each participant.

## Completion check

The trigger reaches one observable outcome, each handoff has a responsible
participant, and the order is supported by source or runtime evidence.
