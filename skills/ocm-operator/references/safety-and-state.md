# OCM Safety And State Rules

## Isolation

OCM envs are isolated by `OPENCLAW_HOME`. Treat the env root and its
`.openclaw` state as user data. Prefer OCM commands for changes to env state.

### Shared Supervisor Preflight

Before lifecycle writes on a store with running user gateways, identify the
installed OCM executable and daemon build. Verify build provenance or reuse
isolation proof for those same artifacts. A version string or OCM's `current`
status alone does not establish which fixes are installed.

Check whether environment creation or reconciliation rebuilds unrelated
supervisor definitions. Differences in caller PATH or temporary-directory
settings must not change sibling gateways. Verify installed artifacts, not
merely the source checkout or version label.

When provenance is insufficient, check the installed executable using temporary
`HOME` and `OCM_HOME`, synthetic launcher definitions, and no background daemon:
record a sibling definition, create an unrelated env with different caller
`PATH`/`TMPDIR`, and compare the sibling definition. It must stay unchanged.
Exercise service reconciliation only with disposable processes in that isolated
store. Never use a live work/personal gateway as the regression fixture.

If the build rewrites siblings, keep test work in a separate scratch OCM store
or use a verified fixed build. A separate env name or `--no-service` within the
live store does not bypass the faulty synchronization. Capture running user
gateways' PIDs, bindings, health, and relevant log positions before writes so
unintended reloads are detectable afterward. Reuse valid build proof until the
artifact changes.

Installing a CLI and refreshing the shared daemon are separate operations.
Include affected gateways in the scope of an authorized daemon refresh; a
request for one disposable environment does not imply a shared-daemon restart.

Use OCM to inspect paths:

```sh
ocm env show <env>
ocm env exec <env> -- env | rg 'OPENCLAW_HOME|OPENCLAW_STATE_DIR|OPENCLAW_CONFIG_PATH|OPENCLAW_SERVICE_REPAIR_POLICY|OCM_ACTIVE_ENV'
```

## Existing User State

For tests involving existing users:

1. Use a clone.
2. Run the full flow on the clone.
3. Keep the source env untouched.
4. Apply the agreed retention policy; do not destroy a preview still in use.

Pattern:

```sh
ocm env clone <source-env> <test-env>
ocm upgrade <test-env> --runtime <runtime>
ocm @<test-env> -- doctor --fix
ocm env destroy <test-env> --yes
```

## Service Boundary

OCM owns service lifecycle for OCM-managed envs. OpenClaw doctor should not
install/start/repair OpenClaw's own service when run through OCM.

Inspect the boundary without repairing state:

```sh
ocm env exec <env> -- env | rg 'OPENCLAW_SERVICE_REPAIR_POLICY'
```

Expected env value:

```text
OPENCLAW_SERVICE_REPAIR_POLICY=external
```

Use OCM service commands:

```sh
ocm service status <env>
ocm service start <env>
ocm service stop <env>
ocm service restart <env>
```

Avoid raw OpenClaw service commands for OCM-managed envs unless the user asks to
test standalone OpenClaw service behavior.

For a busy source-backed gateway, inspect the complete launcher shutdown path
before a planned restart. `pnpm openclaw` can add a runner with a five-second
forced-kill deadline while the gateway requests minutes to drain active work.
Use a supported launch/supervision path that preserves the required drain;
retain Node setup and secret loading when changing a launcher.

## Gateway Outage Diagnosis

Start with `ocm service status <env>`, a probe to the configured gateway
address/port, and timestamped info/error logs. Preserve the initiating shutdown
or failure evidence before attempting repair. Check the daemon log and sibling
gateways to distinguish an env failure from a shared supervisor reload.

For "Another Gateway owner lease is still active", inspect ownership read-only:
recorded PID/start time/hostname, current process identity and hostname, lease
heartbeat/expiry, and listener ownership. A hostname change can classify an
absent local PID as an unknown foreign owner until lease expiry. Distinguish
this from a genuinely live owner; preserve the database and ownership records.
When the old process is confirmed absent and its lease is no longer renewed,
observe OCM's retry after expiry before adding another restart. If startup still
fails, inspect the new failure rather than assuming expiry fixed it.

Verify recovery with health and the intended client connection. Report
interrupted-session recovery separately from gateway availability; neither a
reconnected UI nor a resumed session proves every queued task completed.

## Destructive Commands

Use preview modes when possible:

```sh
ocm env destroy <env>
ocm upgrade <env> --dry-run
ocm upgrade simulate <env> --to <target> --scenario all
```

Use `--yes` only after confirming the target env is not a protected real user
env:

```sh
ocm env destroy <env> --yes
```

Use `--force` only when the user requested it or when destroying an intentional
temporary env that is protected by test setup.

## Release-Shaped Testing

Use built package runtimes for release behavior:

```sh
ocm runtime build-local <runtime> --repo /path/to/openclaw --force
ocm start <env> --runtime <runtime>
```

Do not use `pnpm openclaw`, `ocm dev`, or a source worktree as proof that a
published package will work. Those paths can hide packaging, bundled extension,
or runtime dependency issues.

## Logs And Long-Running Commands

Use env logs:

```sh
ocm logs <env> --tail 100
ocm logs <env> --stream error --tail 100
ocm logs <env> --follow
```

For stuck TUI/gateway symptoms:

```sh
ocm service status <env>
ocm logs <env> --stream error --tail 200
ps -axo pid,ppid,stat,comm | rg 'openclaw|ocm|node'
```

Stop follow commands before ending a task unless the user asked to keep them
running.

## Cleanup Checklist

Before finishing:

```sh
ocm env list
ocm service status
```

After their agreed lifetime ends, destroy task-owned temp envs:

```sh
ocm env destroy <temp-env> --yes
```

Remove temp worktrees created by manual git commands:

```sh
git -C /path/to/openclaw worktree list
git -C /path/to/openclaw worktree remove /path/to/worktree
```

Remove temp archives/directories:

```sh
rm -rf /tmp/<known-temp-dir>
```

Do not remove shared runtimes unless they were created for the task or the user
asks for runtime cleanup.
