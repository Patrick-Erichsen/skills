# My personal agent skills

Public global agent skills I maintain and use across projects in my day-to-day
work.

The layout follows the agent-skills convention: each skill lives in
`skills/<name>/` and has a required `SKILL.md`.

Validate skills with `scripts/validate-skills`, which wraps the official
`skills-ref validate` command from `agentskills/agentskills`.

## Skills

### Utils

- [`html`](skills/html): Choose and create single-file HTML artifacts for visual explanations, plans, reviews, and lightweight tools.

### Planning

- [`linear-agent-project-planning`](skills/linear-agent-project-planning): Plan large agent-run projects as Linear root issues, task queues, multi-week implementation backlogs, or goal-ready project plans.
- [`linear-goal-runner`](skills/linear-goal-runner): Execute a Linear-backed project queue, continue goal work from a root issue, drive child issues to terminal states, and prepare milestone PRs for review.

### Tools

- [`agent-revision-history`](skills/agent-revision-history): Generate a JSON edit history for a Markdown or MDX document from an agent session transcript. I use this in my personal blog to render my edit history to show to what extent I polished an originally AI generated piece of content.
