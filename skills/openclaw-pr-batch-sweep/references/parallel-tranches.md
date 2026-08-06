# Parallel tranches

Use this branch only when the operator explicitly requests multiple independently interactive PR-review sessions. The normal and nightly path remains `standard`.

## Roles

- **Dispatcher:** snapshots, reserves, partitions, creates persistent threads, and reconciles shared state. It does not screen or review assigned PRs.
- **Lane:** owns one immutable manifest and runs the normal proposal, approval, repair, proof, and landing workflow. It cannot dispatch more lanes.
- **Operator:** reviews and approves candidates independently in each visible lane thread.

## Dispatch

1. Clone or refresh the private state repository in an isolated checkout and read `decision-ledger.json`.
2. Refresh `origin/main`, both discovery cursors, handled entries, candidate heads, and `activeReservations`.
3. Build one ordered live snapshot containing exactly `tranche_count * tranche_size` open PRs when available. Exclude only coordination duplicates: terminally handled PRs, unchanged candidate heads, explicit skips, and any PR number already reserved. Do not apply proposal ranking or policy filtering in the dispatcher.
4. Record every PR number, URL, title, author, and exact 40-character head SHA. A missing head fails the snapshot.
5. Run `scripts/create-tranche-run.mjs` to create contiguous, non-overlapping lane files and a next-ledger file containing the reservations. Inspect the counts, hashes, and zero-overlap result.
6. Move the verified next-ledger into place, commit the run directory plus ledger, pull with rebase, and push before creating any lane thread. A push conflict requires rebuilding from the refreshed ledger; never overwrite another run.
7. Create one clean persistent Codex project thread per lane. Title it `OpenClaw PR tranche <lane>/<count> - <run_id>` and invoke this skill with `mode: manifest`, the run ID, lane ID, and lane-file path. Preserve full filesystem/network permissions and the repository's confirmation boundaries. Require the receiver to read back its lane hash before screening.
8. Record each verified thread ID in its lane file. If a receiver cannot be created or verified, keep that lane reserved, mark it `blocked`, and report the exact failure rather than screening it in the dispatcher.

The dispatcher may create at most five lanes. Each lane performs metadata hydration serially, so parallelism exists across persistent threads without per-lane REST fan-out.

## Lane contract

The lane is the sole writer of `runs/<run_id>/lane-<n>.json`. It must:

1. Verify `runId`, `laneId`, repository, entry count, and `manifestHash` before reading GitHub.
2. Set status to `screening`, refresh every assigned PR at its exact head, and run the standard filtering process only over those entries.
3. Persist screened rejections and candidate cards in its file, then set `awaiting-approval` and stop for operator decisions in that lane thread.
4. Record approvals against exact heads. Continue automatically through qualification, repair, proof, and landing for approved heads.
5. Keep all PR-specific GitHub mutations, worktrees, remote leases, and exact-head evidence inside the lane. Update the lane after every terminal outcome.
6. Push lane updates with at most three pull-rebase retries. Because lanes own separate files, a conflict in another file is a dispatcher blocker, not permission to overwrite it.
7. Notify the dispatcher when the approval queue is ready and again when the lane reaches `complete`, `blocked`, or `carried`. Routine progress stays in the lane thread.

Allowed lane statuses are `reserved`, `screening`, `awaiting-approval`, `executing`, `complete`, `blocked`, and `carried`.

## Reconciliation

The dispatcher is the only writer that merges lane state into `decision-ledger.json` or advances global cursors.

1. Refresh all lane files and their recorded exact heads.
2. Copy proposal decisions and terminal outcomes into the canonical ledger without changing their lane evidence.
3. Remove reservations only for reconciled entries. An expired `leaseUntil` remains reserved until the dispatcher confirms the lane is inactive and explicitly marks the run `abandoned`.
4. Advance the relevant cursor once every PR in the contiguous snapshot is accounted for as screened, superseded, terminal, or still represented in `candidateQueue`. Never skip an unresolved gap.
5. Mark the run `complete` when every lane is reconciled. Commit, pull with rebase, and push.

Standard/nightly discovery reads `activeReservations` and skips those PR numbers. It reports stale reservations but does not release them.

## Thread prompt

Give each lane the repository, state repository, run ID, lane ID, lane-file path, dispatcher thread ID, exact permission profile, and this instruction:

> Run `$openclaw-pr-batch-sweep` in `manifest` mode for only the assigned lane. Verify the manifest hash and every live exact head. Perform the normal screening process, present this lane's candidates to Patrick, and wait for his decisions. For approved exact heads, automatically qualify, repair, prove, and land them under current OpenClaw safety gates. Update only the lane file; never advance global cursors or spawn another tranche. Report genuine blockers and approval-ready/terminal milestones to the dispatcher thread.
