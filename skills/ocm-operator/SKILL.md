---
name: ocm-operator
description: Operate OpenClaw Manager (OCM) environments, runtimes, upgrades, and supervised gateways. Use for isolated gateway testing, model/config seeding, startup benchmarking, upgrades, and outage diagnosis.
---

# OCM Operator

## Operating Model

Use OCM as the control plane for OCM-managed OpenClaw environments. Preserve
the existing supervisor for a standalone preview; do not adopt it or change a
shared daemon merely to seed models. Treat an OCM environment as an
isolation boundary: it owns `OPENCLAW_HOME`, state, config, workspace, gateway
port, runtime/launcher binding, and service policy.

The OCM daemon is shared across environments. Before lifecycle writes, verify
that the installed build preserves unrelated gateways; a disposable target
does not by itself isolate supervisor effects.

Prefer OCM commands over raw OpenClaw commands whenever the task touches:

- env creation, cloning, migration, export/import, snapshots, or cleanup
- runtime install/build/verify/update/remove
- upgrades or release testing
- background gateway services
- logs, status, TUI/dashboard, plugin checks, model checks

Run OpenClaw inside an env with:

```sh
ocm @<env> -- <openclaw args>
```

Use `ocm env exec <env> -- <command>` only when you need a non-OpenClaw command
inside the env, such as `env`, `node`, or shell tooling.

## New Test Gateway Default

For a new test gateway, create fresh OCM state and seed only the requested
source profile's model configuration and required portable model credentials.
For a branch or latest-main preview, use the normal
`ocm dev <env> --repo <checkout>` flow and
[model-config-seeding.md](references/model-config-seeding.md). Keep the live
gateway serving while preparing the separate checkout and test environment.

Use a full environment copy only when the user explicitly requests comprehensive
testing with existing state, such as migration or existing-user upgrade tests.
For that branch, import a plain OpenClaw home with `ocm adopt import` or
`ocm migrate`; use `ocm env clone` when the source is already managed by OCM.

## First Steps

1. Inspect current state before changing it:

```sh
ocm env list
ocm service status
ocm runtime list
```

2. Read help for the exact surface before using unfamiliar flags:

```sh
ocm help start
ocm help env
ocm help runtime
ocm help service
ocm help logs
ocm help upgrade
```

3. For detailed command patterns, read
`references/command-cookbook.md`.

4. Before creating, cloning, importing, rebinding, or removing environments,
changing services, or investigating an outage, read
[references/safety-and-state.md](references/safety-and-state.md). Apply its
supervisor isolation check even when the target environment is disposable.

5. Discover paths and runtime bindings using `references/local-paths.md`.
   Done when the source, target, listener, launcher, and state roots are known.

6. For an isolated preview that needs real model configuration and credentials,
   follow [references/model-config-seeding.md](references/model-config-seeding.md).
   Seed selected settings rather than cloning when sessions, channels, and
   automations must stay out of the test environment.

7. When asked for latest-main testing or startup timing, follow
   [references/startup-benchmark.md](references/startup-benchmark.md) before
   starting any build. Reuse verified exact-head artifacts or use the current
   runtime-only build profile; do not default a development preview to a full
   package/declaration build. Inspect host load and disk capacity up front.

## Decision Guide

- **Start a normal runtime-backed env**: use `ocm start <env> --runtime <runtime>`
  or `ocm start <env> --version <version>`.
- **Start a fresh user env**: use `ocm start <env> --runtime <runtime>` first;
  use `--onboard` only when testing interactive onboarding specifically.
- **Use source-backed OpenClaw development**: use `ocm dev <env> --repo <repo>`.
  Do not use this as proof of release packaging.
- **Test release behavior from local OpenClaw source**: use
  `ocm runtime build-local <runtime> --repo <repo> --force`, then test envs
  against that runtime.
- **Test models in a clean preview**: seed only approved model configuration
  and portable auth; preserve the preview URL, token, pairing, and supervisor.
- **Test existing-user upgrade behavior**: clone the existing env, upgrade the
  clone, and never mutate the source env directly.
- **Upgrade a source-backed/local-command env**: run `ocm upgrade <env>
  --dry-run --json` first. If it reports `outcome: local-command`, do not retry
  `ocm upgrade`: update and validate the source checkout, preflight with
  `ocm upgrade simulate <env> --to <repo> --scenario current`, register a new
  named launcher, snapshot the env, rebind it, and restart through OCM.
- **Run OpenClaw commands in an env**: use `ocm @<env> -- ...`.
- **Read logs**: use `ocm logs <env>`.
- **Manage background gateway state**: use `ocm service status/start/stop/restart`.
- **Clean up**: use `ocm env destroy <env> --yes`; this removes env snapshots,
  OCM service policy, and OCM-created dev worktrees.

## Safety Rules

- Treat important user envs such as `work` and `personal` as durable state.
  Clone first for testing unless the user explicitly asks to mutate them.
- Remove envs with `ocm env destroy`.
- Manage OCM env gateway lifecycle with `ocm service`.
- Remember OCM injects `OPENCLAW_SERVICE_REPAIR_POLICY=external` for env-run
  OpenClaw processes, so `openclaw doctor --fix` should repair normal env
  state but skip OpenClaw-owned service lifecycle repair.
- Do not treat `ocm dev`, `pnpm openclaw`, or a source worktree as release
  validation. For release behavior, build and use a package runtime.
- Clean up task-owned temporary artifacts according to the agreed retention
  policy. Keep an active user-testing or PR-preview environment until its
  requested lifetime ends; finishing a chat is not permission to destroy it.
- If a command could change real user data, run read-only inspection or clone
  first, then report the exact command you plan to run if there is ambiguity.
- Preserve the complete existing launcher command when replacing a source
  launcher. In particular, retain required Node `PATH` setup and secret/keyring
  lookups; a replacement launcher that only says `pnpm openclaw` can silently
  drop production integrations.
- Runtime-backed upgrades receive OCM's built-in snapshot/rollback behavior.
  Local-command upgrades do not: create an explicit snapshot before rebinding,
  keep the previous launcher name, and restore both binding and snapshot if the
  supervised gateway fails to restart.

## Source-Backed Upgrade Flow

Use this when `ocm upgrade <env> --dry-run --json` reports `local-command`.

```sh
# Inspect and preflight without changing the real env.
ocm launcher show <current-launcher>
ocm upgrade simulate <env> --to /path/to/openclaw --scenario current

# After the source checkout is refreshed and its required build succeeds:
ocm launcher add <new-launcher> --command '<preserved command>' --cwd /path/to/openclaw
ocm env snapshot create <env> --label before-<new-launcher>
ocm env set-launcher <env> <new-launcher>
ocm service restart <env>

# Verify the bound service, then retain the old launcher for rollback.
ocm service status <env>
ocm logs <env> --tail 100
ocm @<env> -- --version
ocm @<env> -- status
```

If restart or health checks fail, rebind the prior launcher, restore the new
snapshot, restart the service, and capture the failing logs before further
changes.

## Verification Standard

Finish by exercising the relevant command path. Prefer these checks:

```sh
ocm env list
ocm service status <env>
ocm logs <env> --tail 100
ocm @<env> -- --version
ocm @<env> -- status
```

For gateway lifecycle or outage work, probe the configured gateway address and
port: `/healthz` proves liveness; a successful authenticated client connection
proves the intended UI/API path. OCM's `running` can mean only that the launcher
process exists. Compare unrelated gateways' PIDs, bindings, health, and reload
logs with the pre-change observations after lifecycle writes.

Run `doctor --fix` only for an intended repair, with a snapshot or disposable
clone appropriate to the state being changed. It is not a read-only check.

Add plugin/model/TUI checks when the task touches plugins, model auth/catalog,
onboarding, or gateway connectivity:

```sh
ocm @<env> -- plugins list
ocm @<env> -- plugins update --all --dry-run
ocm @<env> -- models list
ocm @<env> -- tui
```

## Dashboard Preview

After the intended Gateway is healthy, obtain an authenticated dashboard
link using that environment's supported dashboard command. Use a preview or
browser-automation skill when available for ingress, handoff, pairing, and UI
proof. Keep bearer URLs private. Verify visible model selection and Connected
state after the app has rendered. Hand off the application root URL so a fresh
browser enters login before opening a conversation; a direct `/chat/...` URL
can open the public-conversation viewer instead. A successful WebSocket handshake alone is
not a rendered-UI check. Apply the agreed preview retention policy.

## Reporting

Keep reports quiet and useful:

- lead with pass/fail/blocker status
- include the exact command for failures
- include concise evidence for passes
- separate OCM issues from OpenClaw runtime/package issues
- say which relevant checks were skipped
- include cleanup performed

Use this failure shape:

```md
Failure:
- Command: `<exact command>`
- Expected: <expected state>
- Actual: <observed state/output>
- Impact: <why it matters>
- Likely owner: OCM | OpenClaw | test setup | external dependency
- Paste to fixer: <short actionable summary>
```
