---
name: loop-creator
description: Create, migrate, pause, or retire a recurring OpenClaw loop using native automations, a persistent read-only dashboard, and retained run evidence. Use when turning a repeatable scan or workflow into an inspectable loop, without a plugin or second scheduler.
license: MIT
---

# Loop Creator

A loop is a scheduled workflow with an owner, a completion contract, and evidence
you can inspect. Compose existing domain skills; do not copy their business rules
into the scheduler prompt. A dashboard reports results. Its automation chat is
where the operator steers the work.

## Create or migrate

1. Inventory the live job, owning skills, source repositories, existing sessions,
   side effects, overlap rules, and last real result. Preserve unrelated jobs and
   in-flight work. Ask only for consequential decisions not already settled.
2. Define one loop per independently useful outcome: stable ID, owning agent and
   skill, schedule/timezone, allowed actions, completion checks, evidence sources,
   shared capacity, and retention. Keep environment details in a private adapter.
   Creation authority is not permission to merge, deploy, or change permissions.
3. Read [the native contract](references/native-openclaw.md). Create a persistent
   named session and a disabled native automation targeting that session. Never
   attach its dashboard to an ephemeral isolated run. Pin stable named widgets.
4. Define the [run and report contract](references/run-contract.md). Keep a private
   per-run evidence directory and an immutable sealed result. Copy the exact skill
   instructions used by a run; future improvements must not change active inputs.
   Domain skills own qualification, repairs, approval and landing mechanics.
5. Exercise a no-side-effect canary through the actual scheduled path. Verify
   job/session binding, tool access, persisted widget readback, trace export,
   resumption, and that the report does not claim production work happened.
6. Enable replacements only after verification. Disable the superseded collector
   before its next firing; never leave both collecting the same queue. Read back
   the schedule, timezone, timeout, delivery settings, and dashboard.

Use `scripts/loop-runtime.mjs` for local claims, run receipts and native report
payloads. It is not a scheduler, work queue, or authorization system. Its CLI
prints usage with no arguments. Existing repository ledgers remain authoritative
for PR reservations; acquire a shared resource lease before mutating one.

## Pause, retire, improve

- Pause with the native job's `enabled:false`. Let healthy in-flight work finish
  unless the operator asks to stop it. Mark the dashboard paused without erasing
  its last result. Retirement keeps sessions, dashboards and evidence intact.
- Consume sealed historical results and actual traces, not a coordinator's claim
  that work succeeded. Separate execution, coverage and report delivery status.
- Publish a narrow improvement only under the operator's chosen policy. Record
  the triggering run, hypothesis, changed source revision, regression check and
  expected effect. Subsequent reflection must check the result of earlier changes.
  Do not silently broaden permissions, merge rules, workload or CI limits.
- Redact retained evidence. Never publish tokens, private transcripts or operator
  identifiers in this reusable skill or its examples.

## Why skill-first

[Linear Loops](https://linear.app/docs/loops) is the product model: scoped
instructions, triggers, connected context and inspectable runs. This does not
establish that Linear internally uses SKILL.md files. OpenClaw already supplies
scheduling, persistent sessions and dashboards; a plugin is only justified by a
missing typed capability or custom UI, not by repetition alone.
[Harness engineering](https://openai.com/index/harness-engineering/) motivates
durable evidence and feedback that changes the system rather than repeating a
larger prompt. Keep the feedback measurable and the runtime simple.
