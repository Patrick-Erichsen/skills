# Visual pedagogy and distribution

This note records the design basis for the `viz-explain` gallery and its public
skill endpoint. The ten patterns are a repertoire of visual questions, not a
closed notation. An agent should select, combine, or adapt them to the user's
learning goal while keeping the underlying facts consistent.

## Distribution decision

Use the Agent Skills Discovery v0.2 convention:

- discovery index: `/.well-known/agent-skills/index.json`;
- indexed skill name: `viz-explain`;
- artifact type: `archive`; and
- conventional artifact URL:
  `/.well-known/agent-skills/viz-explain.tar.gz`.

The archive is required because the skill includes `SKILL.md`, references, and
canonical `.excalidraw` scenes. Its root should be the contents of the
`viz-explain` skill directory, with `SKILL.md` at the archive root. The v0.2
index entry should include `$schema`, `name`, `type`, `description`, `url`, and
the archive's `sha256:` digest. A direct
`/.well-known/agent-skills/viz-explain/SKILL.md` mirror can help humans and old
clients, but the v0.2 index should point to the complete archive so an installer
cannot silently omit the references or scenes.

This convention is implemented, but not yet final: the cross-vendor Agent
Skills proposal is still an open pull request as of 2026-09-04. Cloudflare's
v0.2 discovery RFC defines the paths and archive model, and the Vercel Skills
provider implements v0.2 while retaining the old `/.well-known/skills/` path as
a fallback. Prefer `agent-skills`; do not publish new work at the legacy path.
See the [Cloudflare discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc/blob/main/README.md),
[Agent Skills proposal](https://github.com/agentskills/agentskills/pull/254),
and [Vercel provider source](https://github.com/vercel-labs/skills/blob/main/src/providers/wellknown.ts).

GitHub Pages project sites add the repository name to the URL. The gallery's
build therefore also produces a project-scoped mirror:

- `https://patrick-erichsen.github.io/skills/.well-known/agent-skills/index.json`
- `https://patrick-erichsen.github.io/skills/.well-known/agent-skills/viz-explain.tar.gz`

The canonical discovery index and archive are mirrored into the account's
existing root Pages repository and served at the draft RFC's origin-root paths:

- `https://patrick-erichsen.github.io/.well-known/agent-skills/index.json`
- `https://patrick-erichsen.github.io/.well-known/agent-skills/viz-explain.tar.gz`

The scoped path remains useful with the current Vercel provider when the
installer is given `https://patrick-erichsen.github.io/skills`, because that
provider probes a path-relative `.well-known` index first. Keep the root mirror
and project build byte-identical whenever the skill changes.

## Pedagogical basis

The gallery follows four principles:

1. **Use space to reduce search.** Larkin and Simon showed why a diagram can be
   computationally more useful than equivalent prose: related facts can be
   grouped by location and some inferences become perceptual rather than a
   serial search through sentences. Every scene should therefore make one
   relationship type visually easy to inspect, not merely decorate prose.
   ([Larkin and Simon, 1987](https://doi.org/10.1111/j.1551-6708.1987.tb00863.x))
2. **Segment and signal.** Multimedia-learning research recommends breaking a
   complex explanation into learner-controlled segments, removing incidental
   material, and cueing the organization of essential material. Progressive
   levels, focused routes, legends, and restrained labels implement those
   principles.
   ([Mayer and Moreno, 2003](https://doi.org/10.1207/S15326985EP3801_6))
3. **Choose a view for a concern.** ISO/IEC/IEEE 42010 distinguishes an
   architecture from its descriptions and provides viewpoints and model kinds
   for expressing stakeholder concerns. The gallery should project one
   evidence-grounded system model into several useful views rather than invent
   ten inconsistent systems.
   ([ISO/IEC/IEEE 42010:2022](https://www.iso.org/standard/74393.html))
4. **Keep abstractions and notation coherent.** The C4 model uses hierarchical
   abstractions and separate static, dynamic, and deployment views; its review
   guidance stresses explicit scope, legends, meaningful names, and labelled
   relationships. Reuse stable names and visual anchors across views, but do
   not mix abstraction levels accidentally.
   ([C4 overview](https://c4model.com/),
   [introduction](https://c4model.com/introduction),
   [review checklist](https://c4model.com/diagrams/checklist))

Editable canvases support the conversational loop: a user can make a disputed
fact concrete, then describe or show that correction to the agent. Treat an
edit as feedback to investigate, not automatically as verified architecture.

## Ten-pattern repertoire

| Pattern | Question and boundary | OpenClaw worked-example focus |
| --- | --- | --- |
| **1. Context and system landscape** | What people and systems exist in the chosen scope, and how do they relate? Use **context** when one system is the focus and **landscape** for a portfolio without a single focus; do not show internal components. This follows the C4 [system landscape definition](https://c4model.com/diagrams/system-landscape). | Place OpenClaw among the user, messaging channels, model providers, skills, MCP servers, and external delivery targets. |
| **2. Progressive architecture zoom** | What becomes visible as the explanation moves from system journey to responsibilities to runtime/code? Each level answers a different question; it is not a novice-to-expert ranking. C4 explicitly uses hierarchical diagrams as zoom levels and recommends only the levels that add value ([diagram guidance](https://c4model.com/diagrams)). | Explain automations as outcome, then scheduler/execution/delivery responsibilities, then one recurring isolated agent turn. |
| **3. Request and interaction sequence** | Who exchanges what, and in what order, for one bounded scenario? Keep this to causally connected runtime interactions, not historical incident chronology. UML interactions and sequence diagrams provide the formal basis ([UML 2.5.1, Clause 17](https://www.omg.org/spec/UML/2.5.1/PDF)); C4 offers a lighter [dynamic diagram](https://c4model.com/diagrams/dynamic). | Trace an inbound chat message through gateway, session, agent/model turn, tool call, and channel reply. |
| **4. State lifecycle** | Which states can one entity occupy, which events trigger transitions, and which guards or terminal states matter? This is about valid state change, not service-to-service call order ([UML 2.5.1, Clause 14](https://www.omg.org/spec/UML/2.5.1/PDF)). | Show an automation moving through configured, scheduled, running, succeeded/failed, and rescheduled states. |
| **5. Data transformation pipeline** | How does information change shape, ownership, or validation status from source to result? Label inputs, transformations, stores, and outputs; omit control-plane detail unless it changes the data. UML activities and object flows are the established semantic analogue ([UML 2.5.1, Clause 15](https://www.omg.org/spec/UML/2.5.1/PDF)). | Follow a channel payload into a normalized message, assembled prompt/context, model output, and outbound channel payload. |
| **6. Dependency and deployment topology** | What depends on or communicates with what, and where do runtime instances live? Distinguish logical dependency edges from physical/runtime placement. C4's [deployment view](https://c4model.com/diagrams/deployment) maps software instances onto infrastructure. | Map gateway process, control UI, state/config directories, provider endpoints, plugins, ports, and channel connections. |
| **7. Layered responsibility stack** | Which concerns sit above, below, or behind one another, and what boundary does each layer own? Layers express responsibility and allowed direction, not progressive zoom. The C4 abstraction model is an established abstraction-first precedent ([C4 abstractions](https://c4model.com/abstractions)). | Separate interaction surfaces, orchestration/control, agent runtime, capabilities, persistence, and external infrastructure. |
| **8. Event timeline and history** | What happened when across a real or hypothetical interval? Use a shared time axis, evidence markers, and uncertainty; unlike a request sequence, events need not form one causal call chain. UML timing and interaction semantics provide reusable notation ([UML 2.5.1, Clause 17](https://www.omg.org/spec/UML/2.5.1/PDF)). | Reconstruct an automation from schedule fire through tool activity, report creation, announcement, and later inspection. |
| **9. Failure and recovery paths** | Where can a scenario fail, how is failure detected, what retries/compensation/fallbacks occur, and what remains degraded? Show the successful path lightly so alternate paths have context. ATAM grounds architecture analysis in scenarios, risks, sensitivities, and quality-attribute tradeoffs ([SEI ATAM report](https://www.sei.cmu.edu/library/the-architecture-tradeoff-analysis-method-2/)). | Trace model, tool, persistence, or Telegram-delivery failure through retry, error recording, degraded completion, and operator recovery. |
| **10. Decision and tradeoff matrix** | Which alternatives are being compared against explicit criteria, evidence, risks, and unknowns? A matrix organizes a decision; it should not manufacture a winner through arbitrary scores. ATAM is the grounding for scenario-based comparison across competing quality attributes ([SEI ATAM report](https://www.sei.cmu.edu/library/the-architecture-tradeoff-analysis-method-2/)). | Compare isolated-agent versus main-session automation execution for context, safety, repeatability, observability, and delivery behavior. |

## Boundary refinements

Keep all ten entries, with these names and distinctions:

- use **Context and system landscape** so the agent can choose single-system or
  portfolio scope correctly;
- use **Progressive architecture zoom** to emphasize projections of one model,
  not three unrelated diagrams or audience labels;
- use **Request and interaction sequence** for one causal scenario and reserve
  **Event timeline and history** for chronology and reconstruction;
- use **Dependency and deployment topology** for graph/placement questions and
  **Layered responsibility stack** for conceptual boundaries and allowed
  direction; and
- use **Decision and tradeoff matrix** because engineering choices normally
  involve competing quality attributes, not a context-free feature checklist.

These refinements preserve the requested ten-pattern gallery while reducing
the most likely overlaps.
