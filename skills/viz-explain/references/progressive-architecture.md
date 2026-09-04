# Progressive architecture zoom

Use this explainer when one system needs several levels of specificity. The
levels are projections of one evidence-grounded model, not audience rankings.

Canonical scene: [progressive-architecture.excalidraw](../assets/scenes/progressive-architecture.excalidraw)

## Plan the zoom

Choose two to five useful levels from the subject and state the choice before
drawing. For every level name:

- the question it answers;
- the new detail it reveals; and
- the detail it intentionally hides.

Preserve vocabulary, colors, and approximate spatial anchors as detail grows.
Map domain behavior to concrete files, entry points, and runtime behavior only
when the deeper level needs them.

Useful level questions are:

1. **System journey** — what enters, which major stages occur, and what outcome
   leaves?
2. **Responsibilities** — which subsystems own boundaries, state, and delivery?
3. **Runtime trace** — what actually runs, in what order, with which persistence
   and failure behavior?

## Choose the presentation

- **Separate views** when each level needs its own layout.
- **Shared-canvas floors** when comparison and stable spatial memory matter.
- **Nested drill-down** when the user will follow one branch at a time.

The canonical scene demonstrates shared floors. Adapt it rather than treating
three as a fixed count or the columns as a required layout.

## Worked OpenClaw example

Explain a recurring report at three zoom levels. The first shows schedule →
report → Telegram outcome. The second reveals scheduler, execution, persistence,
and delivery responsibilities. The third traces tick → isolated session → agent
turn → model/tools → save → announce. The same “report” and “delivery” concepts
remain recognizable while implementation detail appears.

## Completion check

Every level answers a distinct question, the shared facts stay consistent, and
the user can ask to expand one level without restarting the model.
