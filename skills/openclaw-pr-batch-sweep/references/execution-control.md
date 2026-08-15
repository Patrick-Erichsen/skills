# Execution control

Use this contract after approval and when an interrupted run resumes. The current task is the control plane in `standard` mode; a manifest lane is its own control plane.

## Durable checkpoints

Create one run manifest and one coordinator-owned checkpoint per approved PR in the private state repository. Use separate PR files so independent lanes never write the same file. Only the coordinator reconciles terminal results into `decision-ledger.json`.

Each checkpoint records:

- run ID, PR number, approved execution-root SHA, current execution SHA, tree hash, and worker ID;
- current state, state-entered timestamp, completed-state timestamps, and next action;
- worktree, branch, remote provider, lease, proof command, and run IDs without credentials or raw untrusted logs;
- public outcome URL, CI run, autoreview run, ClawSweeper comment/run, independent verifier, prepare markers, merge SHA, and cleanup result when available;
- blocker class: `waiting-ci`, `waiting-provider`, `waiting-clawsweeper`, `needs-author`, `needs-operator`, or `infrastructure-blocked`.

Allowed states are:

`approved -> qualifying -> worktree -> repairing -> proving -> frozen -> syncing -> hosted-gates -> exact-review -> prepared -> verified -> merging -> merged -> cleaned`

Terminal alternatives are `closed`, `rejected`, `blocked`, `carried`, and `superseded`.

Write the checkpoint after each state transition and before starting an external wait. On restart, verify live head ownership and resume the first incomplete state. A missing worker or disconnected stream causes reassignment from the checkpoint, not an operator prompt.

## Scheduler

- Keep one implementation worker for 1-3 independent approvals and two for 4 or more.
- One worker owns one PR at a time. One worktree belongs to one PR.
- A PR waiting on CI, provider allocation, or ClawSweeper releases its worker. Keep only the remote state needed to resume; remove an idle worktree when reconstruction is safe.
- Workers send structured milestones only at `started`, `waiting`, `package-ready`, and `blocked`. The coordinator wakes on milestones or external gate changes and updates a compact live matrix.
- Continue until every approved PR has a terminal result. Do not return a progress update as the final result while actionable queue work remains.

## Exact-head remote proof

Use `$crabbox` for provider mechanics. One proof reconstruction must bind these facts in machine-readable output:

- approved execution-root SHA and task-owned repair ancestry;
- fetched `pull/<PR>/head`, frozen `origin/main` SHA, final checked-out SHA, and tree hash;
- reviewed overlay files, test-only Git identity, dependency-mount exclusions, provider, lease, command, exit status, and proof run URL or ID.

Use a repository-owned exact-head helper when one exists. Otherwise use one coordinator-reviewed reconstruction, one setup retry, and one provider fallback. After those bounds, record `infrastructure-blocked` with the exact next action. Do not repeat hydration, sync, allocation, or reconstruction loops.

## Frozen packages

An implementation worker returns a frozen package with:

- PR, approved root, local final commit, root-to-final ancestry, tree hash, diff hash, and changed files;
- reproduction, root cause, owner-boundary verdict, focused proof, remote proof IDs, autoreview result, remaining findings, and requested coordinator action;
- `githubMutationsPerformed: []` and cleanup requirements.

The coordinator inspects the final diff and package before any push. After the final remote head exists, it assembles a landing package with:

- exact remote head and tree hash;
- fresh final-head autoreview run and verdict;
- exact-head CI run and verdict;
- ClawSweeper durable comment URL, reviewed SHA, verdict, and handled rank-up moves;
- resolved review-thread evidence;
- independent verifier ID and verdict;
- trusted `scripts/pr` prepare markers and cleanup plan.

Missing or mismatched fields prevent merge delegation. The coordinator alone invokes merge. If the task runner can restrict worker GitHub credentials or mutation tools, remove them from workers. If it cannot, workers still receive no mutation command or delegation.

## Mutation order

Serialize public mutations within one PR. Serialize all merges across the batch. Independent PRs may remain in different non-mutating states at the same time.

Immediately before each mutation, the coordinator refreshes that PR only, verifies the expected head, writes the intended operation to the checkpoint, performs the operation, and records the result. An external head change sets `superseded` and returns the new head for operator approval.
