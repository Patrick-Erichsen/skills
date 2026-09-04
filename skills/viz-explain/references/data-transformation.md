# Data transformation pipeline

Use this explainer when the key question is how information changes shape,
ownership, validation, or destination.

Canonical scene: [data-transformation.excalidraw](../assets/scenes/data-transformation.excalidraw)

## Method

1. Name the source data and the result the user cares about.
2. Draw data shapes as the primary boxes. Label transformations on the arrows
   and stores below or beside the flow.
3. Show fields only when a field is added, removed, normalized, or used to make
   a decision.
4. Mark trust boundaries and validation before untrusted data becomes agent or
   model context.
5. Hide orchestration detail unless it materially changes the data.

## Worked OpenClaw example

Follow a channel payload through parsing and authentication into a normalized
event, then a durable session turn, assembled model context, assistant output,
and a channel-specific reply. The session store branches below the flow because
it preserves the turn without being another transformation stage.

An evidence-heavy version can annotate example schemas or field names under
each shape. A teaching version should keep them short enough that the change in
meaning remains visible at a glance.

## Completion check

The user can say what form the data has at every stage, what changes it, and
where trust, validation, or persistence alters its meaning.
