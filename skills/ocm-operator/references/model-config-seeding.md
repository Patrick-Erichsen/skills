# Seed Model Configuration into an Isolated Gateway

## 1. Establish the transfer boundary

Resolve source and target config files, state roots, agent directories, gateway
addresses, and service owners. Require distinct canonical paths. Preserve the
target gateway auth, port, bind address, public URL, paired devices, workspace,
and agent entries. Record protected-field hashes without logging their values.

Default new test gateways to scoped seeding. Choose one mode before copying:

- Use scoped seeding for a new test gateway. Copy only model/provider settings,
  the selected model and aliases, and the credentials required for them.
- Use a full copy only when the user explicitly requests comprehensive testing
  with existing state. Import a plain home with `ocm adopt import` or `ocm migrate`;
  clone it with `ocm env clone` when the source is already managed by OCM.

Do not import channels, cron jobs, hooks, sessions, memory, browser profiles,
MCP authorization, or unrelated integrations in scoped mode. Keep the source
read-only. Done when the allowed fields and protected state are explicit.

## 2. Read configuration and credential ownership

Inspect `models`, `auth.profiles`, `auth.order`, `agents.defaults.models`,
`agents.defaults.model`, and the selected source agent's model override. Prefer
the effective selected agent model over the global default. Copy neither the
source agent roster nor its workspace paths.

Resolve credential ownership using the installed build's code or supported
export API. Do not assume every build stores credentials in the same database.
For builds with SQLite auth cells, inspect the source read-only:

- Agent-local: `auth_profile_store.store_json`, row `store_key = primary`.
- Shared state: `config_machine_state.value_json`, key `authProfiles.store`.
- Shared owner metadata: key `auth.sharedStore` in `config_machine_state`.

Read only named profiles required by the selected configuration. Do not copy
an entire agent database: it can contain conversation history and memory.
Keep secret values in process memory, not reports, shell arguments, or logs.
Copy static API keys only when authorized and not marked nonportable. Use
supported login or clone behavior for OAuth; do not transplant refresh tokens.

For SecretRefs, resolve their actual owner and copy only the referenced names.
Preserve their scope, kind, and host restrictions. Inline source keys must be
treated as secrets and moved to a protected target store when supported.
Done when each required provider has a portable credential or a named blocker.

## 3. Prepare the target using its existing owner

Enable the required, already-installed provider plugins without installing
unrequested plugins. Preserve unrelated target settings. Inspect the installed
CLI help and Gateway RPC schemas before writes because ownership rules vary.

Prefer the running target's authenticated management API. When a CLI requires
exclusive offline ownership, stop only the target through its service owner.
If the CLI rejects a mismatch with another installed Gateway service, do not
uninstall that service, bypass the guard, or write auth tables directly. Use
the target's supported online API instead. Restart only the stopped target.

For protected named secrets, the supported CLI pattern is:

```sh
openclaw secrets store set SECRET_NAME --kind secret
```

Supply the value on stdin using an in-memory subprocess input, with explicit
target state/config environment. Preserve host restrictions with the installed
command's supported flags. Do not print the value to construct a shell command.
Done when required plugins and named secrets exist in the target.

## 4. Import API keys through the online model API

Authenticate an official Gateway client to the explicit target URL with the
target's token read into memory. Use the intended target agent and the required
operator scope. For a source checkout, its `src/gateway/call.ts` client is a
supported internal transport; inspect that build's API before using it.

The verified request shape is:

```js
await callGateway({
  url: targetUrl,
  expectUrl: targetUrl,
  token: targetTokenReadInMemory,
  config: targetConfig,
  method: "models.authSetApiKey",
  params: { provider, apiKey: sourceKeyReadInMemory, agentId: targetAgentId },
  scopes: ["operator.admin"],
  timeoutMs: 90000,
});
```

Import sequentially and retain each returned `profileId`. The online API may
choose a new ID such as `provider:manual`; remap auth order and profile-based
references instead of assuming source IDs survive. Do not pass a forced
`profileId` unless the installed API explicitly supports it.

Avoid `gateway call --params` for secret payloads: command-line arguments are
observable. Use an official client with in-memory values or a documented
protected stdin/file mechanism. Sanitize failures before printing them.
Done when the target API confirms every selected credential write.

## 5. Apply the model configuration

Read `config.get` from the target and retain its current hash. Send
`config.patch` with `baseHash`, a JSON `raw` patch, and only the allowed fields:

- `models`, including provider connection settings and target SecretRefs.
- `agents.defaults.models`, explicitly replaced when a strict allowlist is used.
- The effective source agent model as the target default.
- Auth ordering and credential references remapped to returned target IDs.

Use `replacePaths: ["agents.defaults.models"]` when supported by that build.
Never replace the whole target config. Account for a possible target reload or
restart, then reconnect to the same endpoint. Fail on concurrent modification
rather than overwriting a newer config.

Done when the saved patch is valid, required SecretRefs resolve, and protected
settings and browser pairing match their pre-transfer values.

## 6. Prove readiness

Check target `health`, `models.authStatus`, and `models.list` using the intended
agent. Report configured inventory separately from live-tested providers.
Run one bounded real inference through the target gateway:

```sh
openclaw infer model run --gateway --agent TARGET_AGENT \
  --model PROVIDER/MODEL --prompt "Reply with exactly: PROVIDER-PROOF-OK" --json
```

Execute with explicit target state/config/port or the OCM environment wrapper.
Require a successful response, the intended provider/model, and the expected
text. A populated model selector alone does not prove working authentication.

Open an authenticated dashboard and wait for the main application to render.
Check visible model selection, Connected state, and page errors. Do not let a
wait for `Connect` match `Connected` before the app loads. Keep one-time links
and bearer URLs private.

Read back selected target credentials internally and compare with the source
without exposing values. Recheck source configuration and protected target
state; record sanitized evidence and any providers still missing credentials.
Done when real inference and the rendered UI pass, or each failure has a
concrete blocker. Leave the preview running for its agreed lifetime.
