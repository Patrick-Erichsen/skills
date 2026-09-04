---
name: viz-explain
description: Explain any subject visually with evidence-grounded Excalidraw MCP App views. Use when a diagram, map, flow, comparison, timeline, or other visual model would make a concept easier to understand.
---

# Visual Explanation

Turn the user's question into a visual learning loop: understand the learning
goal, research the subject, build one coherent model, choose a visual grammar,
render it with the official Excalidraw MCP App, and refine it conversationally.
Use Excalidraw as the primary learning surface; prose supports the view.

## Preflight

Check the client before doing research or drawing:

1. The current surface must render MCP Apps. A known visual surface includes
   Codex desktop or an Apps-enabled OpenClaw Control UI. A terminal-only client
   cannot satisfy this requirement.
2. The official Excalidraw MCP server must be connected and expose both
   `read_me` and `create_view`. When provenance is visible, require
   `https://mcp.excalidraw.com/mcp`; tool availability alone does not prove
   that the App is available to the client.
3. Call `read_me` once before the first `create_view` call and follow the
   element-format contract it returns.

If a check fails, stop and give the exact missing requirement. Do not silently
replace the App with raw tool output or a static diagram:

> Cannot run `viz-explain` here: <missing Excalidraw MCP | this client cannot
> render MCP Apps>. It requires the official Excalidraw MCP in an MCP
> Apps-capable UI client.

Useful setup paths:

- Codex: `codex mcp add excalidraw --url https://mcp.excalidraw.com/mcp`, then
  use Codex desktop rather than Codex CLI.
- OpenClaw: run `openclaw config set mcp.apps.enabled true --strict-json`, add
  the server with
  `openclaw mcp add excalidraw --url https://mcp.excalidraw.com/mcp --transport streamable-http`,
  verify it with `openclaw mcp doctor excalidraw --probe`, and use the Control
  UI after restarting the Gateway.

## Learning loop

1. Infer the subject, the user's learning goal, and the boundary that matters.
   The user may provide code, prose, a URL, a dataset, or only a question; use
   the sources appropriate to that subject.
2. Choose the visual grammar that makes the important inference perceptual.
   Read [visual-pedagogy.md](references/visual-pedagogy.md) when choosing or
   combining patterns is ambiguous. Then read only the relevant explainer:

   | User's question | Explainer |
   | --- | --- |
   | What exists around this system? | [Context and system landscape](references/system-landscape.md) |
   | How does detail change as we zoom in? | [Progressive architecture zoom](references/progressive-architecture.md) |
   | Who exchanges what, in what order? | [Request and interaction sequence](references/request-sequence.md) |
   | Which states and transitions are valid? | [State lifecycle](references/state-lifecycle.md) |
   | How does information change shape? | [Data transformation pipeline](references/data-transformation.md) |
   | What depends on what, and where does it run? | [Dependency and deployment topology](references/dependency-topology.md) |
   | Which responsibility belongs at each depth? | [Layered responsibility stack](references/layered-abstraction.md) |
   | What happened when? | [Event timeline and history](references/event-timeline.md) |
   | Where can it fail, and how does it recover? | [Failure and recovery paths](references/failure-recovery.md) |
   | Which option fits these priorities? | [Decision and tradeoff matrix](references/decision-matrix.md) |
3. Research before drawing. Build one canonical model with stable names,
   relationships, evidence, and visible uncertainty. Treat every view as a
   projection of that model, not as an unrelated illustration.
4. Announce the visual plan briefly: what the view answers, what becomes visible,
   and what stays hidden. Choose the number of views from the subject.
5. Use the explainer's canonical `.excalidraw` scene as composition scaffolding,
   not a stencil. Adapt layout, metaphor, grouping, and visual emphasis to the
   subject while preserving the method's semantic boundary. Render the first
   useful Excalidraw App view with short labels and stable spatial anchors.
6. Explain the view in plain language with source paths, citations, or other
   evidence where they help the user verify it.
7. Invite conversational refinement: expand, simplify, compare, trace, reorder,
   or focus a region. A refinement creates a successor view from the canonical
   model and changes only the requested detail.

## Interaction contract

The conversation drives learning; selecting or clicking a shape does not send a
new prompt. Treat level rails, legends, and callouts as visual orientation by
default. Use element links or viewport controls only when the current
Excalidraw App documents them and a quick UI check confirms they work; never
claim that a decorative shape is interactive.

Keep the evidence model and the latest view coherent. If an App checkpoint
expires, rebuild it from the canonical model and say that visual continuity was
lost. End when the requested subject has a rendered view, its important claims
are grounded, and the user has a clear next refinement they can ask for.
