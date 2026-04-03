---
name: git-commit-push
description: Stages changes, generates a Conventional Commits message from your diff, commits, and pushes the branch to origin. Creates a new branch if currently on main/master. Use when you want to commit and push work in one step without opening a PR.
allowed-tools: Bash
---

# Git Commit & Push

Stage changes, generate a semantic commit message following the Conventional Commits spec, commit, and push the branch to origin.

## Steps

### 1. Check current state

Run these in parallel:
- `git status -sb` — see what's tracked/untracked
- `git diff --staged` — see what's already staged
- `git diff` — see unstaged changes

### 2. Branch safety

If the current branch is `main`, `master`, or the repo's default branch, **do not commit directly to it**. Create a new branch first:

```
git checkout -b <type>/<short-description>
```

Use the commit type and a slug of the description (e.g., `feat/add-auth`, `fix/null-pointer`).

### 3. Stage files

If nothing is staged, stage all relevant changes:

```
git add -A
```

Never stage:
- `.env` files or files containing secrets, tokens, or credentials
- Large binaries unrelated to the change
- Lock files unless the change intentionally updates dependencies

### 4. Analyze the diff and generate a commit message

Run `git diff --staged` and determine:

**Type** — pick exactly one:

| Type | When |
|------|------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, no logic change |
| `refactor` | Code restructure with no behavior change |
| `perf` | Performance improvement |
| `test` | Add or update tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration |
| `chore` | Maintenance, tooling, no production change |
| `revert` | Reverts a prior commit |

**Scope** (optional) — the module, file, or area affected, e.g. `auth`, `api`, `ui`, `db`.

**Description** — imperative mood, present tense, under 72 characters. Do not end with a period.

Format: `type(scope): description` or `type: description` if scope isn't meaningful.

For breaking changes, append `!` after type/scope and add a `BREAKING CHANGE: <explanation>` footer.

### 5. Commit

```
git commit -m "<type>(<scope>): <description>"
```

Use a heredoc if the message includes a body or footer:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description

BREAKING CHANGE: explanation of what breaks and how to migrate
EOF
)"
```

### 6. Push

Push the current branch with upstream tracking:

```
git push -u origin $(git branch --show-current)
```

If the push fails due to upstream divergence (non-fast-forward), **do not force push**. Report the error and the suggested resolution to the user.

If the push fails due to auth/credential issues, report the error without retrying.

## Safety Rules

- Never update git config
- Never force push to `main` or `master` — warn the user if they explicitly request it
- Never skip hooks (`--no-verify`)
- Never commit files containing secrets or credentials
- Never amend published commits — create a new commit instead
- If pre-commit hooks fail, fix the underlying issue before retrying
