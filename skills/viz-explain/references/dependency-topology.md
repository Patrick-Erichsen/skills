# Dependency and deployment topology

Use this explainer for runtime dependencies, deployment placement, shared
resources, and blast-radius questions.

Canonical scene: [dependency-topology.excalidraw](../assets/scenes/dependency-topology.excalidraw)

## Method

1. Decide whether the concern is logical dependency, runtime communication, or
   physical placement; encode different edge types visibly.
2. Draw deployment boundaries before the software inside them.
3. Label instances and ports only when topology or reachability depends on them.
4. Separate required dependencies from optional capabilities.
5. Mark shared state and single points of failure without turning the view into
   a request sequence.

## Worked OpenClaw example

Place the Control UI, Gateway process, plugins, and local state inside one host
boundary. Put channel APIs, model providers, MCP servers, and optional nodes
outside. Solid arrows mean runtime communication; dashed arrows mean a component
is loaded from or reads a local dependency. A port label explains why the UI and
Gateway share a host without implying every external connection uses that port.

For a multi-host installation, duplicate the host boundary and place actual
instances before drawing cross-host communication.

## Completion check

Every boundary has operational meaning, edge semantics are explicit, and the
view supports a concrete reachability, ownership, or failure-impact answer.
