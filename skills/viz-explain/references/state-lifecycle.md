# State lifecycle

Use this explainer when valid states and transitions explain behavior better
than service layout or call order.

Canonical scene: [state-lifecycle.excalidraw](../assets/scenes/state-lifecycle.excalidraw)

## Method

1. Name the single entity whose lifecycle is shown.
2. Derive states from persisted or observable behavior, not status words that
   merely sound plausible.
3. Label transitions with events; add guards only where the same event can lead
   to different states.
4. Distinguish terminal states, retry loops, and the next lifecycle occurrence.
5. Put side effects beside transitions rather than disguising them as states.

## Worked OpenClaw example

Show one automation moving from configured to scheduled when it is saved, queued
when a schedule fires, and running when capacity is available. A successful run
completes; an error may fail or enter retrying, then return to the queue after
backoff. A dashed loop from success to scheduled represents the next occurrence,
not a mutation of the completed run.

The visual prevents two common confusions: “scheduled” is a waiting state, not
an executing process, and “retrying” belongs to one occurrence rather than the
automation definition itself.

## Completion check

Every arrow has a trigger, every state has observable meaning, and retry or
terminal behavior cannot be mistaken for a normal forward transition.
