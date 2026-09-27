import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fingerprint, normalizedSource } from './review-source.mjs';

function pull(assignees, updatedAt = '2026-09-27T12:00:00Z') {
  return {
    title: 'Restore the admin guard',
    body: 'The existing catalog operation is unguarded.',
    author: { login: 'contributor' },
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt,
    labels: { totalCount: 0, nodes: [] },
    comments: { totalCount: 0, nodes: [] },
    assignees: { totalCount: assignees.length, nodes: assignees.map((login) => ({ login })) },
    isDraft: false,
    headRefOid: 'unchanged-head',
    baseRefOid: 'unchanged-base',
    mergeable: 'MERGEABLE',
    mergeStateStatus: 'CLEAN',
    reviewDecision: null,
    additions: 2,
    deletions: 0,
    changedFiles: 1,
    files: { totalCount: 1, nodes: [{ path: 'convex/catalog.ts', additions: 2, deletions: 0 }] },
    reviews: { totalCount: 0, nodes: [] },
    reviewThreads: [],
    reviewCommentCount: 0,
    commits: { nodes: [{ commit: { oid: 'unchanged-head' } }] },
  };
}

test('a maintainer assignment invalidates an unchanged PR head and review', () => {
  const unassigned = fingerprint(normalizedSource('pull', pull([])));
  const assigned = fingerprint(normalizedSource('pull', pull(['maintainer'])));
  assert.notEqual(assigned, unassigned);
  assert.equal(
    fingerprint(normalizedSource('pull', pull(['maintainer'], '2026-09-27T12:05:00Z'))),
    assigned,
  );
});

test('assignee ordering is stable, and an incomplete assignee connection stays visible', () => {
  const one = fingerprint(normalizedSource('pull', pull(['maintainer', 'contributor'])));
  const two = fingerprint(normalizedSource('pull', pull(['contributor', 'maintainer'])));
  assert.equal(one, two);

  const incomplete = pull(['maintainer']);
  incomplete.assignees.totalCount = 2;
  assert.equal(normalizedSource('pull', incomplete).assigneesTruncated, true);
});
