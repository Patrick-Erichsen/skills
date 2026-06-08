---
name: agent-revision-history
description: Generate a public JSON edit history for a Markdown or MDX document from an agent session transcript, including document snapshots, diffs, generic edit summaries, and an optional live Codex CLI canary.
---

# Agent Revision History

Use when asked to turn an agent chat/session transcript plus a Markdown or MDX document into a reusable revision-history JSON artifact.

## Workflow

1. Identify the source transcript, target document, and output JSON path.
2. If the document was renamed during the session, pass old paths with `--document-alias`.
3. Generate the artifact:

```sh
npm exec -- tsx <skill-dir>/scripts/cli.ts -- \
  --transcript <session.jsonl> \
  --document <post.mdx> \
  --output <revision-history.json> \
  --strip-path-prefix <repo-root>
```

4. Verify the generated JSON:

```sh
npm exec -- tsx --test <skill-dir>/scripts/revision-history.test.ts
rg -n "/Users/|rollout-|OPENAI_API_KEY|session:[0-9a-f-]" <revision-history.json>
```

The `rg` command should return no public-safety leaks.

## Optional Live Canary

Run only when the user approves a network/model call and `OPENAI_API_KEY` is available:

```sh
RUN_AGENT_REVISION_CODEX_LIVE_TEST=1 npm exec -- tsx --test <skill-dir>/scripts/codex-live.test.ts
```

The canary creates a temporary `CODEX_HOME`, runs one deterministic Codex edit, and verifies that current Codex JSONL `file_change` events still parse correctly.

## Optional UI

If the host app wants a starter UI, copy `assets/shadcn/revision-history.tsx`
into the app's component directory, shadcn-style.

Treat it as app-owned code:

- adapt imports to the app's local UI primitives
- wire data however the app already loads data
- move styling into the app's existing style system
- keep the generated JSON schema as the component contract

## Public Artifact Rules

- Always strip local path prefixes.
- Use a safe transcript label, not a raw local session file path.
- Do not include raw transcripts in the output.
- Treat generated JSON as public: inspect for local paths, secrets, private URLs, private account IDs, and session IDs before publishing.
