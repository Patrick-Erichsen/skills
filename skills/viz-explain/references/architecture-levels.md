# Architecture levels

Use this template when the user wants to understand a system, codebase,
subsystem, control flow, or architecture at several levels of specificity. It
keeps one evidence-grounded model while changing how much of that model is
visible.

## Plan the levels

Choose the useful number from the system; three is a good default, but two to
five may be clearer. Announce the plan before drawing using content-based names,
not age, education, or expertise labels. For every level state:

- the question it answers;
- the new detail it reveals; and
- the detail it intentionally hides.

Preserve vocabulary and approximate spatial anchors as detail increases. Map
domain behavior to concrete files, entry points, and runtime behavior in the
deeper views.

Useful level questions include:

1. **System journey** — what enters the system, what major stages it crosses,
   and what outcome comes out?
2. **Subsystem responsibilities** — which components own each boundary, state
   transition, or correctness guarantee?
3. **Runtime execution** — what actually runs, in what order, with which
   persistence, retries, delivery, or failure paths?

## Choose a presentation pattern

Use the smallest pattern that stays readable. When comparing patterns, render
all three from the same canonical model and explain the tradeoff.

### Separate views

Create one focused Excalidraw App view per level. Use this when each level needs
its own layout or a shared canvas would be unreadable. Repeat a compact level
rail and highlight the active level so the views remain related.

### Shared-canvas floors

Place the levels in distinct regions of one large canvas and use camera updates
to focus each region. Repeat the level rail in each region. Use this when stable
spatial memory and comparison matter more than inline readability. A camera
update chooses the viewport during rendering; it does not mutate an earlier App
card.

### Nested drill-down

Keep the overview central, then place subsystem and runtime views near the
parent concepts they explain. Connect the regions and preserve the overview as
an anchor. Use this when the user is likely to follow one branch at a time.

## Visual contract

- Use rounded level controls as an orientation rail; make the active level
  visually distinct.
- Treat controls as non-interactive unless same-scene links or viewport
  navigation are explicitly documented and tested in the current App.
- Keep unrelated automation types, provider internals, and low-value code
  details hidden until they answer the user's next question.
- Show uncertainty and inferred relationships explicitly.
- A follow-up such as “expand the scheduler” or “trace one request” creates a
  successor view and updates only the relevant level or branch.

## Completion check

The explanation is complete when the canonical model is evidence-grounded, the
chosen levels or views are rendered, each view has a clear question, and the
user can request a focused refinement without restarting the research.
