# Layered responsibility stack

Use this explainer to separate conceptual responsibilities and allowed direction.
It is a stack of concerns, not a progressive zoom through the same concern.

Canonical scene: [layered-abstraction.excalidraw](../assets/scenes/layered-abstraction.excalidraw)

## Method

1. Define the responsibility owned by each layer in one phrase.
2. Order layers by abstraction or policy-to-mechanism direction.
3. Put examples inside a layer only when they clarify its responsibility.
4. Show crossings that violate or deliberately bypass the normal direction.
5. Avoid “miscellaneous” layers; if a concept has no clear home, revisit the
   boundaries rather than forcing it into the stack.

## Worked OpenClaw example

Arrange interaction surfaces above Gateway orchestration, agent execution,
capabilities, and persistence/infrastructure. The Control UI and Telegram express
intent; the Gateway owns routing, sessions, schedules, and policy; the runtime
owns the model/tool loop; skills, plugins, and MCP provide capabilities; state
and providers supply durable and external mechanisms.

This view answers where a change belongs. A Telegram-specific parsing change is
near the surface; a session-routing rule belongs to orchestration; a reusable
visual-explanation method belongs among capabilities.

## Completion check

Each concern has one clear owner, the ordering has a stated meaning, and a new
requirement can be placed without relying on component call order.
