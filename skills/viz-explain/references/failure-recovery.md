# Failure and recovery paths

Use this explainer when a normal-flow diagram would hide the system's reliability
behavior.

Canonical scene: [failure-recovery.excalidraw](../assets/scenes/failure-recovery.excalidraw)

## Method

1. Draw the successful path lightly for orientation.
2. At each meaningful boundary, show the failure, detection signal, and owner.
3. Distinguish retry, resume, compensation, fallback, degraded completion, and
   operator intervention.
4. Mark durable boundaries so the user can see whether recovery duplicates work.
5. Include retry limits or idempotency only where evidence supports them; label
   unknown policy as unknown.

## Worked OpenClaw example

The happy path is schedule → agent run → save report → send Telegram → complete.
A model failure retries the turn; a persistence failure leaves the run failed;
a Telegram failure retries delivery without regenerating the report. Recorded
errors lead to operator visibility. The saved report is the durable boundary
that makes delivery-only retry safe.

Adapt the branches to the actual runtime. The scene teaches the questions to ask;
it does not assert that every OpenClaw installation has the pictured retry policy.

## Completion check

Each important failure has detection, ownership, and an outcome, and the diagram
makes duplicate or lost work risks visible.
