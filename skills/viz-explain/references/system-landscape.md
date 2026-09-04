# Context and system landscape

Use this explainer to orient the user before internal implementation matters.
Choose **context** when one system is the focus and **landscape** when the
relationships among several systems are the subject.

Canonical scene: [system-landscape.excalidraw](../assets/scenes/system-landscape.excalidraw)

## Method

1. Name the scope and the question in one sentence.
2. Place people and external systems around the system boundary. Keep internal
   components hidden.
3. Label relationships with intent or exchanged value, not protocols unless a
   protocol is the user's concern.
4. Mark uncertain actors or boundaries explicitly. Never fill a gap with a
   plausible-looking box.
5. Use the canonical scene as a composition seed, then change its layout and
   visual metaphor to fit the subject.

## Worked OpenClaw example

Put the user on the left, OpenClaw in the center, and the systems it coordinates
on the right. Messaging channels and the Control UI are interaction surfaces;
model providers, MCP servers, skills, and durable state are dependencies. The
view answers “what world does OpenClaw sit in?” It intentionally hides gateway
modules, session tables, plugin hooks, and request order.

The scene uses distance to make the boundary perceptual: the user reaches
OpenClaw through a surface, while OpenClaw reaches providers and capabilities.
For a portfolio landscape, replace the central boundary with several peer
systems and show ownership or data exchange among them.

## Completion check

The user can name the system's purpose, actors, neighbors, and boundary without
learning internal components that belong in another view.
