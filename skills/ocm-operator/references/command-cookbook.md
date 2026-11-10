# OCM Command Cookbook

Use these commands as patterns. Run `ocm help <surface>` when flags may have
changed.

## Inspect State

```sh
ocm env list
ocm env show <env>
ocm env status <env>
ocm service status
ocm service status <env>
ocm runtime list
ocm runtime show <runtime>
ocm runtime verify <runtime>
```

## Run OpenClaw Inside An Env

```sh
ocm @<env> -- --version
ocm @<env> -- status
ocm @<env> -- plugins list
ocm @<env> -- models list
ocm @<env> -- dashboard
ocm @<env> -- tui
```

For non-OpenClaw commands inside the env:

```sh
ocm env exec <env> -- node --version
ocm env exec <env> -- pwd
```

Select only needed, non-secret environment keys when inspecting `env`; avoid
printing the full environment of a credential-bearing launcher.

## Create Or Start Envs

Apply the [shared supervisor preflight](safety-and-state.md#shared-supervisor-preflight)
before these lifecycle commands when other gateways are running.

Runtime-backed env from an installed runtime:

```sh
ocm start <env> --runtime <runtime>
```

Runtime-backed env from a published version:

```sh
ocm start <env> --version <version>
ocm start <env> --channel stable
ocm start <env> --channel beta
```

Foreground/no-service env:

```sh
ocm start <env> --runtime <runtime> --no-service
```

Interactive onboarding path:

```sh
ocm start <env> --runtime <runtime> --onboard
```

Local command launcher env:

```sh
ocm start <env> --command 'pnpm openclaw' --cwd /path/to/openclaw
ocm start <env> --command 'pnpm openclaw' --cwd /path/to/openclaw --no-service
```

## Dev Worktree Envs

Use for source-backed development and reproductions. Do not use this as proof
of release packaging.

```sh
ocm dev <env> --repo /path/to/openclaw
ocm dev <env> --repo /path/to/openclaw --service
ocm dev <env> --watch
ocm dev <env> --watch --force
ocm dev <env> --onboard
ocm dev status
ocm dev status <env>
```

Rerun `ocm dev <env>` after pulling the source repo to refresh the worktree
binding.

## Runtime Management

Install a published runtime:

```sh
ocm runtime install --channel stable
ocm runtime install --channel beta
ocm runtime install --version <version>
```

Build a release-shaped runtime from local source:

```sh
ocm runtime build-local <runtime> --repo /path/to/openclaw --force
ocm runtime verify <runtime>
ocm runtime show <runtime>
node "$HOME/.ocm/runtimes/<runtime>/files/node_modules/openclaw/openclaw.mjs" --version
```

Update or remove runtimes:

```sh
ocm runtime update <runtime>
ocm runtime update --all
ocm runtime remove <runtime>
```

## Upgrade Flows

Dry-run:

```sh
ocm upgrade <env> --dry-run
ocm upgrade <env> --version <version> --dry-run
ocm upgrade <env> --runtime <runtime> --dry-run
```

Real upgrade:

```sh
ocm upgrade <env>
ocm upgrade <env> --channel beta
ocm upgrade <env> --version <version>
ocm upgrade <env> --runtime <runtime>
```

### Source-Backed Or Local-Command Environments

First check `ocm upgrade <env> --dry-run --json`. An `outcome` of
`local-command` is intentional: OCM will not mutate arbitrary source commands.
Use a source preflight, then create a replacement launcher and rebind only after
a snapshot:

```sh
ocm upgrade simulate <env> --to /path/to/openclaw --scenario current
ocm launcher show <old-launcher>
ocm launcher add <new-launcher> --command '<preserved command>' --cwd /path/to/openclaw
ocm env snapshot create <env> --label before-<new-launcher>
ocm env set-launcher <env> <new-launcher>
ocm service restart <env>
```

Preserve the prior launcher until gateway health and the intended client
connection pass, alongside status, logs, and runtime-version checks. Rebind it
and restore the snapshot on failure.

Simulation matrix:

```sh
ocm upgrade simulate <env> --to <version> --scenario all
ocm upgrade simulate <env> --to beta --scenario all
ocm upgrade simulate <env> --to /path/to/openclaw --scenario all
ocm upgrade simulate <env> --to /path/to/openclaw --scenario all --keep-simulations
```

## Existing-User Test Flow

Clone first:

```sh
ocm env clone <source-env> <test-env>
ocm start <test-env>
ocm service status <test-env>
ocm logs <test-env> --tail 100
```

Exercise only task-required checks. `doctor --fix` mutates state; run it only
for an authorized repair on a snapshot or disposable clone.

Exercise:

```sh
ocm @<test-env> -- status
ocm @<test-env> -- doctor --fix
ocm @<test-env> -- plugins list
ocm @<test-env> -- plugins update --all --dry-run
ocm @<test-env> -- tui
```

Upgrade the clone:

```sh
ocm upgrade <test-env> --version <version>
ocm upgrade <test-env> --runtime <local-runtime>
```

## Fresh-User Test Flow

```sh
ocm start <fresh-env> --runtime <runtime>
ocm service status <fresh-env>
ocm @<fresh-env> -- --version
ocm @<fresh-env> -- status
ocm @<fresh-env> -- doctor --fix
ocm @<fresh-env> -- plugins list
ocm @<fresh-env> -- plugins update --all --dry-run
ocm @<fresh-env> -- models list
ocm @<fresh-env> -- tui
```

## Plugins

Install or update plugins only when explicitly requested. Listing and
inspection do not authorize installation.

```sh
ocm @<env> -- plugins --help
ocm @<env> -- plugins list
ocm @<env> -- plugins list --json
ocm @<env> -- plugins inspect <plugin-id> --json
ocm @<env> -- plugins install /path/to/plugin-dir
ocm @<env> -- plugins install /path/to/plugin.tgz
ocm @<env> -- plugins install <plugin-spec>
ocm @<env> -- plugins update <plugin-id> --dry-run
ocm @<env> -- plugins update <plugin-id>
ocm @<env> -- plugins update --all --dry-run
```

Check both manifest data and `package.json`-derived metadata when testing
plugins that declare information in both places.

## Services And Logs

Use OCM service commands for supervised gateway lifecycle:

```sh
ocm service status
ocm service status <env>
ocm service install <env>
ocm service start <env>
ocm service stop <env>
ocm service restart <env>
ocm service uninstall <env>
```

Logs are env-first:

```sh
ocm logs <env>
ocm logs <env> --tail 100
ocm logs <env> --stream error --tail 100
ocm logs <env> --follow
```

## Migration And Portability

Plain `~/.openclaw` into OCM:

```sh
ocm adopt inspect ~/.openclaw
ocm adopt plan --name <env> ~/.openclaw
ocm adopt import --name <env> ~/.openclaw
```

One-step migration:

```sh
ocm migrate <env> ~/.openclaw
```

Export/import OCM envs:

```sh
ocm env export <env> --output ./<env>.ocm-env.tar
ocm env import ./<env>.ocm-env.tar --name <new-env>
```

## Cleanup

Preview before destroying:

```sh
ocm env destroy <env>
```

Destroy:

```sh
ocm env destroy <env> --yes
```

Protected env:

```sh
ocm env destroy <env> --yes --force
```

Check for leftovers:

```sh
ocm env list
ocm service status
git -C /path/to/openclaw worktree list
```
