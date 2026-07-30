---
name: prototype-tui
description: Build throwaway, fixture-driven terminal UI prototypes and compare two to four interactive variants side by side in tmux using a repository's native TUI stack and run commands.
---

# Prototype TUI

Use this skill to isolate one terminal interface, render it with the project's
real TUI stack, and compare two to four design variants in tmux.

## Rules

- Read the repository instructions before editing.
- Check for an existing component harness, demo, fixture runner, or prototype
  convention before creating one.
- When iterating on an existing surface, include its current implementation as
  the first `baseline` variant with the same fixture data. Only omit the
  baseline when the user explicitly asks for a greenfield comparison.
- Use the real project renderer, theme, copy, and components where practical.
- Replace network calls, discovery, models, installs, config writes, databases,
  and other durable effects with deterministic in-memory fixtures.
- Do not run the full application when an isolated surface is enough.
- Treat prototype code as throwaway. Do not promote it directly to production.
- Follow the repository's trust and sandbox rules before executing its code.
- Preserve unrelated and pre-existing worktree changes.

## Determine the pane commands

Keep the tmux launcher mechanical. The agent determines each command from the
user's request and the target repository:

1. Use an exact command supplied by the user when it reaches the requested
   surface safely.
2. Otherwise inspect the repository's documented runtime, package scripts,
   examples, component demos, and adjacent tests.
3. Prefer the repository's native runner and installed TUI framework. Do not
   add a second framework or package manager for the prototype.
4. If no isolated entry point exists, create the smallest throwaway executable
   harness beside the target component or in the repository's established
   prototype location.
5. Prefer one harness with `--variant=<id>` when the variants share fixtures,
   but separate commands are valid when that is simpler for the repository.

Every pane command must:

- run from the supplied working directory without additional setup;
- render interactively and own its tmux-provided PTY;
- use the same fixture data and intended terminal dimensions as its siblings;
- avoid live or durable side effects; and
- be reported exactly to the user at handoff.

Do not pipe interactive TUI output into tmux. Pass the command directly so each
pane receives a real PTY.

## Workflow

1. Read the target component, renderer adapter, callers, adjacent tests, and
   the installed TUI framework's documentation or types.
2. Create the smallest executable harness that reaches the target surface.
3. If the surface already exists, make both the no-argument invocation and
   `--variant=baseline` render its current implementation unchanged.
4. Add two or three structurally different alternatives for two to four total
   variants including the baseline.
5. Smoke-test every exact pane command directly.
6. Launch every variant in a tmux pane with the bundled launcher.
7. Iterate with `--refresh`, which respawns the panes without replacing the
   session or reopening the user's terminal.
8. After the user chooses a direction, carry the decision into production code
   with the repository's normal implementation and validation workflow. Remove
   or separately capture the prototype.

## Launch the comparison grid

Resolve this skill's installed directory from the loaded `SKILL.md`, assign it
to `prototype_tui_skill_dir`, then run:

```bash
prototype_tui_skill_dir="<directory containing this SKILL.md>"
"$prototype_tui_skill_dir/scripts/launch-tmux-grid.sh" \
  --open \
  settings-prototype "$PWD" \
  "A - Baseline" "node prototype.ts --variant=baseline" \
  "B - Grouped" "node prototype.ts --variant=grouped" \
  "C - Focused" "node prototype.ts --variant=focused"
```

Substitute the repository-native commands; Node and `--variant` are examples,
not requirements.

After editing the prototype, run the same command with `--refresh` instead of
`--open`. This preserves the tmux session, attached external terminal, window,
and first pane while restarting all pane commands and reapplying the grid.

The launcher refuses to replace an existing session unless `--refresh` is
explicitly provided. `--open` uses the user's `.command`-associated terminal
app on macOS, Windows Terminal from WSL, or the first available Linux launcher
from `xdg-terminal-exec`, `$TERMINAL`, and `x-terminal-emulator`. If no
supported launcher is available, the session remains ready and the script
exits successfully after printing the manual attach command.

When invoked from a non-interactive `TERM=dumb` environment, the launcher
removes its inherited `NO_COLOR` only from prototype pane processes so the
external terminal renders its normal colors. Prefer the external terminal over
an agent's embedded terminal unless the user requests the embedded surface.
Leave the session running for user review unless asked to stop it.

## Handoff

Report:

- the prototype path and every exact run command;
- the tmux session name and attach command;
- which effects were replaced with fixtures;
- available variant ids;
- whether the prototype changed production code, which should normally be no.
