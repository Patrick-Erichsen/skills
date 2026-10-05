# Action authorization mechanics

Resolve action scope from the current task and operator-supplied policy.
Patrick's personal standing rules live in Software Factory's private
`loops/clawhub.md` and `references/clawhub-authority.md`; keep those permissions
out of this reusable skill. Explicit human-review mode remains human-gated.

Bind human PR approval to repository, PR number, exact head, current source
fingerprint, immutable review revision and named action. Bind issue approval to
repository, issue, fingerprint, review revision and action. Bind admin approval
to exact target, command family, mutation and evidence. Refresh the full target
before acting; changed targets require the applicable renewed qualification or
approval. Inventory, review, queue admission and tool access are not approval.

Retain candidate versus qualified ledger states. Record the actual contract,
eligibility/proof, current head, main integration, resolved feedback and required
gates before a qualified public action. Serialize external writes and record
actor, target revision, timestamp, action and resulting URL/SHA. The operator
policy owns any batch limits and permission for evidence-backed closeout.
