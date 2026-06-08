# Repository Instructions

This is Patrick's public repository of global agent skills he personally
maintains and uses across projects in day-to-day work. Keep every skill
maintained-by-Patrick, reusable, active, and safe to publish.

## Layout

- Put skills under `skills/<skill-name>/`.
- Every skill must have `SKILL.md` with YAML frontmatter containing `name` and `description`.
- Put helper scripts inside the owning skill's `scripts/` directory.
- Use `scripts/validate-skills` after skill changes.

## README Maintenance

Whenever adding, removing, renaming, or recategorizing a skill, update `README.md` in the same change.

The README should keep skills grouped by category, similar to a catalog:

- Agent
- Docs
- Planning
- Utils

Add a new category only when the existing ones do not fit.

## Public-Safety Rules

- Do not commit secrets, tokens, private hostnames, private account IDs, raw transcripts, or sensitive local paths.
- Do not add one-off project skills, private ops runbooks, third-party skills, or skills Patrick does not actually use.
- Do not copy personal workflow skills into this repo unless their contents are public-safe and reusable across projects.
- Prefer generic descriptions that help agents route to the skill.
