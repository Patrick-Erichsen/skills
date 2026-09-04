# Decision and tradeoff matrix

Use this explainer to compare plausible choices against explicit criteria. It
organizes a decision; it does not manufacture a universal winner.

Canonical scene: [decision-matrix.excalidraw](../assets/scenes/decision-matrix.excalidraw)

## Method

1. State the decision and the scenario before listing alternatives.
2. Choose criteria that change the decision: quality attributes, constraints,
   ownership, evidence, risks, and unknowns.
3. Use descriptive evidence instead of arbitrary numeric scores.
4. Expose tradeoffs and missing information. Weight criteria only when the user
   has supplied priorities.
5. End with a conditional decision rule rather than a context-free ranking.

## Worked OpenClaw example

Compare a main-session system event, an isolated agent turn, and a webhook. The
rows cover context source, best-fit work, isolation, delivery ownership, and the
main operational risk. Main-session events preserve continuity; isolated turns
favor repeatable bounded work; webhooks put triggering and payload ownership at
an HTTP boundary.

The resulting rule is: choose the boundary that matches where context originates
and who should own failure recovery. Actual OpenClaw configuration and code
evidence should replace any generic cell before recommending an option.

## Completion check

The alternatives are viable, every criterion matters to the scenario, unknowns
are visible, and the recommendation follows from stated priorities.
