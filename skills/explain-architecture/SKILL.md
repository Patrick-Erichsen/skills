---
name: explain-architecture
description: Research and explain a technical system through an adaptive set of progressively detailed Excalidraw MCP App views. Use when an engineer wants to understand architecture, control flow, or subsystem relationships at multiple levels of detail.
---

# Explain Architecture

Build one evidence-grounded mental model of the requested system, then reveal it
through progressively more detailed Excalidraw views. Keep the explanation
conversational: the user can ask to expand, simplify, compare, or trace any part
of the system and the views evolve with the conversation.

## Hard Preflight

Complete this before researching or drawing:

1. Apply the client check first. If the current interface is Codex CLI, another
   terminal-only client, or any non-visual agent runtime, fail immediately even
   when the Excalidraw tools are present. Tool availability, `_meta.ui`
   metadata, the MCP Apps media type, and a successful server handshake prove
   only that the server supplies an App; they do not prove that the current
   client renders it.
2. Pass the client check only when system or host context explicitly identifies
   a known MCP Apps-rendering surface, such as Codex desktop or an Apps-enabled
   OpenClaw Control UI. Absence of a positive client capability signal is
   failure. The required media type is `text/html;profile=mcp-app`.
3. Confirm the official Excalidraw MCP server is connected and exposes both
   `read_me` and `create_view`. When provenance is observable, require the
   official endpoint `https://mcp.excalidraw.com/mcp`; tool names alone do not
   prove provenance.
4. Call `read_me` once before the first `create_view` call and follow the
   element-format contract it returns.

If either capability check fails, stop. Do not fall back to raw MCP results,
Mermaid, ASCII, or a static image because those conceal the missing interactive
surface. State which requirement failed and give the relevant setup:

- Codex: run
  `codex mcp add excalidraw --url https://mcp.excalidraw.com/mcp`, then use the
  Codex desktop app rather than Codex CLI.
- OpenClaw: enable MCP Apps and add the remote server:
  `openclaw config set mcp.apps.enabled true --strict-json`,
  `openclaw mcp add excalidraw --url https://mcp.excalidraw.com/mcp --transport streamable-http`,
  verify with `openclaw mcp doctor excalidraw --probe`, restart the Gateway,
  then use the OpenClaw Control UI.

Use this failure shape:

> Cannot run `explain-architecture` here: <missing Excalidraw MCP | this client
> cannot render MCP Apps>. It requires the official Excalidraw MCP in an MCP
> Apps-capable UI client. Configure it, switch clients if needed, and retry the
> same request.

## Establish the Learning Target

Infer from the invocation:

- the system or subsystem to research
- what the user is trying to understand or decide
- relevant boundaries, scenarios, or constraints

The user chooses the subject; the agent chooses how to research it. Adapt to any
engineer without assigning an age, education, or expertise label. Ask only when
the subject itself cannot be identified safely.

## Research One Canonical Model

Research before drawing. Use the sources appropriate to the subject: local
code, repository guidance, runtime behavior, primary documentation, or the web.
Distinguish confirmed behavior from inference.

Build a private canonical model containing:

- stable concept names and plain-language responsibilities
- the important relationships and runtime transitions
- the evidence supporting each important claim
- uncertainties that should remain visible

All detail levels are projections of this same model, not unrelated diagrams.
For codebases, explain the product or domain behavior first and map it to exact
files, entry points, and runtime behavior in deeper views.

## Announce the Detail Plan

Choose the useful number of levels based on the system and the user's goal.
Default to three; use roughly two to five when the material demands it. Before
drawing, explicitly state:

`I’ll use <N> levels: <name — question answered>; ...`

Name levels for their content, such as `System journey`, `Subsystem
responsibilities`, and `Runtime execution`. Do not use `ELI5`, age groups,
academic levels, `basic`, or `advanced`.

For every level define:

- the question it answers
- what becomes visible
- what intentionally remains hidden

Each successive level should preserve the earlier vocabulary while revealing
only the next useful detail. Preserve spatial anchors within shared-canvas and
nested views, and across separate views only when readability permits.

## Choose a Navigation Pattern

Choose the smallest pattern that stays readable in the current MCP App. If the
user asks to compare approaches, render all three against the same canonical
model and explain the tradeoff after the comparison.

### Separate views

Create one focused MCP App view per level. Use when each level needs a different
layout or would become unreadable on a shared canvas. Repeat a compact level rail
and highlight the active level so the views still feel related.

### Shared-canvas floors

Place levels in distinct regions of one large canvas and use camera updates to
move between them. Repeat a compact level rail in each region. Use when stable
spatial memory and direct comparison matter more than inline readability. Use
`cameraUpdate` to choreograph the streamed drawing and choose its final
viewport; it does not move a previously rendered App card later.

### Nested drill-down

Keep the overview central and place deeper component or runtime views in nearby
detail regions connected to their parent concepts. Use when the user is likely
to explore one branch at a time.

## Level Controls

Render the level rail as rounded Excalidraw elements, with the active level
visually distinct. Treat it as a visual navigation index by default. The
official MCP App currently does not document or reliably handle agent-authored
same-scene links, so users navigate a shared board by pan/zoom or ask for a
focused successor view.

Enable clickable floor controls only when the current App version explicitly
documents same-scene element links and a UI test confirms that one control pans
to its target in both inline and fullscreen modes. A level control changes only
the viewport; it never initiates research or sends a prompt. Do not invent an
App URL, use an external URL as a fake floor control, or claim that a decorative
shape is interactive.

## Draw and Iterate

- Design for the MCP App's inline width first; offer fullscreen for dense views.
- Keep labels short, legible, and in domain language.
- Revisions create successor App views; earlier cards do not mutate. Track each
  level's latest checkpoint ID and element IDs privately, restore only that
  checkpoint, and replace the mapping with the successor checkpoint.
- If a checkpoint expires, rebuild that view from the canonical model and tell
  the user that visual continuity was lost.
- Preserve conceptual identity and approximate position across levels. When an
  Excalidraw element is deleted, follow the server contract and give its
  replacement a new element ID.
- Show uncertainty explicitly rather than inventing missing architecture.
- Keep source paths and citations in the accompanying response unless a compact
  evidence label materially helps the drawing.

After the initial views, invite natural-language iteration such as `expand the
scheduler`, `trace one request`, `hide persistence details`, or `compare these
two paths`. Research and redraw only after such a conversational request;
selection or clicking alone does not drive the agent.

A later focus request creates a successor view from the relevant checkpoint
with a new `cameraUpdate`; it does not pan or modify an earlier App card.

For each revision, say briefly what changed, which level changed, and what
remains intentionally hidden.
