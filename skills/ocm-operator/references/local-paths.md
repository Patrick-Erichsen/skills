# Discover Paths and Bindings

1. Locate OCM with `command -v ocm`, then read `ocm env list`,
   `ocm env show <env>`, and `ocm service status <env>`.
   Done when the selected environment, state root, launcher, listener, and
   runtime provenance are explicit.
2. Inspect the named source launcher and its wrappers without printing secrets.
   Preserve its working directory, Node PATH, and secret/keyring setup. Do not
   infer a running gateway's checkout from a familiar repository directory.
3. Resolve the OCM store from `${OCM_HOME:-$HOME/.ocm}` and confirm actual
   paths from OCM output. Treat existing checkouts and durable environments as
   user-managed; use a task-specific worktree and disposable env for tests.
4. For a standalone preview, discover its supervisor instead of assuming OCM
   ownership. Record explicit `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`,
   agent directories, port, and public ingress.
5. Give the test env a unique name and complete the
   [shared-supervisor preflight](safety-and-state.md#shared-supervisor-preflight).
   Done when source and target canonical paths differ and no unrelated
   gateway needs to be stopped or reconfigured.
