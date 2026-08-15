# Candidate approval gate

Use this gate to separate cheap discovery from substantive review and repair.

## Proposal phase

Discovery may read public metadata, PR files, labels, checks, mergeability, and existing review summaries. It does not establish whether the patch is correct or best.

Before presenting a candidate, verify that no other human OpenClaw maintainer has participated through a top-level comment, submitted review, or inline review comment. Candidates with prior maintainer participation never reach this approval gate.

For each candidate, present:

- PR link, title, author, exact head SHA, age, and source (`operator` or `discovery`).
- Claimed operator or contributor value in one sentence.
- Surface, production/test/docs LOC, changed-file count, and change kind.
- Live mergeability and CI summary, including every failing or pending non-routine check.
- Visible risk labels or policy warnings.
- Estimated review cost: `small`, `medium`, or `large`.
- Recommendation: `approve and land`, `decline`, or `needs operator judgment`.

These are candidate cards, not code-review verdicts. Use `unknown` for facts that require code execution or owner-boundary analysis.

## Durable states

Write proposals to `decision-ledger.json.candidateQueue`:

```json
{
  "number": 12345,
  "headSha": "0123456789abcdef",
  "status": "proposed",
  "source": "discovery",
  "proposedAt": "2026-08-05T00:00:00Z"
}
```

Allowed states:

- `proposed`: waiting for operator decision.
- `approved`: the exact head becomes an execution root and automatically enters qualification, bounded repair, proof, and guarded landing.
- `declined`: exact head will not be reviewed.
- `deferred`: keep visible but take no action.
- `delegated`: another named task owns the exact head.
- `superseded`: the head changed after the recorded decision.

An approval covers the recorded execution-root SHA and coordinator-reviewed, task-owned repair descendants of that SHA. Record each execution head and require all landing gates on the final immutable head. A contributor, bot, or other external head change becomes a new proposal. Terminal ledger categories remain terminal regardless of candidate-queue state.

## Approval boundary

Before approval, stay in metadata screening. After approval, the current task refreshes the live head, creates the durable execution checkpoint, and immediately follows the full qualification, proof, repair, and landing workflow without asking for another kickoff or merge confirmation. Resume interruptions from that checkpoint. Pause only for an externally changed head, a newly discovered policy/product decision, or a risk expansion outside the approved outcome. The private state repository is the workflow tracker; make no Linear calls or issues.
