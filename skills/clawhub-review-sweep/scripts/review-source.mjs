import { createHash } from 'node:crypto';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function fingerprint(source, { includeObservedAt = false } = {}) {
  const materialSource = { ...source };
  if (!includeObservedAt) delete materialSource.updatedAt;
  const digest = createHash('sha256').update(JSON.stringify(stable(materialSource))).digest('hex');
  return `sha256:${digest}`;
}

export function normalizedSource(kind, node) {
  const base = {
    title: node.title,
    body: node.body ?? '',
    author: node.author?.login ?? null,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    labels: node.labels.nodes.map((entry) => entry.name).sort(),
    ...(node.labels.totalCount > node.labels.nodes.length ? { labelsTruncated: true } : {}),
    comments: node.comments.nodes,
    commentCount: node.comments.totalCount,
    commentsTruncated: node.comments.totalCount > node.comments.nodes.length,
  };
  if (kind === 'issue') return base;
  return {
    ...base,
    assignees: node.assignees.nodes.map((entry) => entry.login).sort(),
    ...(node.assignees.totalCount > node.assignees.nodes.length
      ? { assigneesTruncated: true }
      : {}),
    isDraft: node.isDraft,
    headRefOid: node.headRefOid,
    baseRefOid: node.baseRefOid,
    mergeable: node.mergeable,
    mergeStateStatus: node.mergeStateStatus,
    reviewDecision: node.reviewDecision,
    additions: node.additions,
    deletions: node.deletions,
    changedFiles: node.changedFiles,
    files: node.files.nodes,
    filesTruncated: node.files.totalCount > node.files.nodes.length,
    reviews: node.reviews.nodes,
    reviewCount: node.reviews.totalCount,
    reviewsTruncated: node.reviews.totalCount > node.reviews.nodes.length,
    reviewThreads: node.reviewThreads,
    reviewCommentCount: node.reviewCommentCount,
    latestCommit: node.commits.nodes[0]?.commit ?? null,
  };
}
