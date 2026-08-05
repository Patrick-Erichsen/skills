#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { REVIEW_STATUSES, reviewRevision } from './review-schema.mjs';

const args = process.argv.slice(2);
let stateDir = '';
let repository = 'openclaw/clawhub';

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--state') stateDir = args[++index] ?? '';
  else if (args[index] === '--repo') repository = args[++index] ?? repository;
  else if (args[index] === '--help') {
    console.log('Usage: sync-open-items.mjs --state <checkout> [--repo owner/name]');
    process.exit(0);
  } else throw new Error(`Unknown argument: ${args[index]}`);
}

if (!stateDir) throw new Error('--state is required');
if (repository !== 'openclaw/clawhub') {
  throw new Error('clawhub-review-sweep v0.1.0 supports only openclaw/clawhub');
}
const [owner, name] = repository.split('/');
if (!owner || !name) throw new Error(`Invalid repository: ${repository}`);

let graphqlCall = 0;

function graphqlData(query) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      graphqlCall += 1;
      const attemptQuery = `${query}\n# review-sweep-${process.pid}-${Date.now()}-${graphqlCall}-${attempt}`;
      const output = execFileSync('gh', ['api', 'graphql', '-f', `query=${attemptQuery}`], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      const parsed = JSON.parse(output);
      if (parsed.errors?.length) throw new Error(JSON.stringify(parsed.errors));
      return parsed.data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) execFileSync('sleep', [String(attempt * 2)]);
    }
  }
  throw lastError;
}

function graphql(query) {
  return graphqlData(query).repository;
}

let restCall = 0;

function restPages(endpoint) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      restCall += 1;
      const attemptEndpoint = `${endpoint}${separator}review_sweep_attempt=${process.pid}-${Date.now()}-${restCall}-${attempt}`;
      const output = execFileSync(
        'gh',
        ['api', '--paginate', '--slurp', '-H', 'Cache-Control: no-cache', attemptEndpoint],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
      );
      return JSON.parse(output);
    } catch (error) {
      lastError = error;
      if (attempt < 3) execFileSync('sleep', [String(attempt * 2)]);
    }
  }
  throw lastError;
}

function paginatedArray(endpoint) {
  return restPages(endpoint).flat();
}

function normalizeIssueComment(comment) {
  return {
    author: { login: comment.user?.login ?? null },
    body: comment.body ?? '',
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    url: comment.html_url,
  };
}

function normalizeReview(review) {
  return {
    author: { login: review.user?.login ?? null },
    body: review.body ?? '',
    state: review.state,
    submittedAt: review.submitted_at,
    url: review.html_url,
    commit: review.commit_id ? { oid: review.commit_id } : null,
  };
}

function normalizeReviewComment(comment) {
  return {
    id: comment.id,
    reviewId: comment.pull_request_review_id,
    replyToId: comment.in_reply_to_id ?? null,
    author: { login: comment.user?.login ?? null },
    body: comment.body ?? '',
    path: comment.path,
    line: comment.line ?? null,
    startLine: comment.start_line ?? null,
    side: comment.side ?? null,
    startSide: comment.start_side ?? null,
    subjectType: comment.subject_type ?? null,
    commitOid: comment.commit_id,
    originalCommitOid: comment.original_commit_id,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    url: comment.html_url,
  };
}

function groupReviewThreads(comments) {
  const threads = new Map();
  for (const comment of comments) {
    const rootId = comment.replyToId ?? comment.id;
    const thread = threads.get(rootId) ?? { rootId, comments: [] };
    thread.comments.push(comment);
    threads.set(rootId, thread);
  }
  return [...threads.values()];
}

function completeThreadCommentIds(thread) {
  const ids = thread.comments.nodes.map((comment) => comment.databaseId);
  const expected = thread.comments.totalCount;
  let cursor = thread.comments.pageInfo.hasNextPage ? thread.comments.pageInfo.endCursor : null;
  while (cursor) {
    const query = `query {
      node(id: ${JSON.stringify(thread.id)}) {
        ... on PullRequestReviewThread {
          comments(first: 100, after: ${JSON.stringify(cursor)}) {
            totalCount
            pageInfo { hasNextPage endCursor }
            nodes { databaseId }
          }
        }
      }
    }`;
    const connection = graphqlData(query).node?.comments;
    if (!connection || connection.totalCount !== expected) {
      throw new Error(`Review thread ${thread.id}: comment set changed during pagination`);
    }
    ids.push(...connection.nodes.map((comment) => comment.databaseId));
    cursor = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  }
  if (ids.length !== expected || ids.some((id) => !Number.isInteger(id))) {
    throw new Error(`Review thread ${thread.id}: incomplete comment IDs`);
  }
  return ids;
}

function fetchReviewThreadMetadata(number) {
  const threads = [];
  let cursor = null;
  let expected = 0;
  do {
    const query = `query {
      repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) {
        pullRequest(number: ${number}) {
          headRefOid
          reviewThreads(first: 100, after: ${cursor ? JSON.stringify(cursor) : 'null'}) {
            totalCount
            pageInfo { hasNextPage endCursor }
            nodes {
              id isResolved isOutdated path line startLine diffSide startDiffSide
              comments(first: 100) {
                totalCount
                pageInfo { hasNextPage endCursor }
                nodes { databaseId }
              }
            }
          }
        }
      }
    }`;
    const pull = graphql(query).pullRequest;
    if (!pull) throw new Error(`PR #${number} disappeared while fetching review threads`);
    const connection = pull.reviewThreads;
    expected = connection.totalCount;
    threads.push(
      ...connection.nodes.map((thread) => ({
        id: thread.id,
        commentIds: completeThreadCommentIds(thread),
        isResolved: thread.isResolved,
        isOutdated: thread.isOutdated,
        path: thread.path,
        line: thread.line,
        startLine: thread.startLine,
        diffSide: thread.diffSide,
        startDiffSide: thread.startDiffSide,
      })),
    );
    cursor = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (cursor);
  if (threads.length !== expected) {
    throw new Error(`PR #${number}: incomplete review-thread metadata`);
  }
  return threads;
}

function completeCheckContexts(oid, expectedTotal) {
  const checkPages = restPages(
    `repos/${owner}/${name}/commits/${oid}/check-runs?per_page=100`,
  );
  const checkRuns = checkPages.flatMap((page) => page.check_runs ?? []).map((run) => ({
    __typename: 'CheckRun',
    name: run.name,
    status: run.status?.toUpperCase() ?? null,
    conclusion: run.conclusion?.toUpperCase() ?? null,
    detailsUrl: run.details_url,
    startedAt: run.started_at,
    completedAt: run.completed_at,
  }));
  const statusHistory = paginatedArray(
    `repos/${owner}/${name}/commits/${oid}/statuses?per_page=100`,
  );
  const seenContexts = new Set();
  const statuses = statusHistory.filter((status) => {
    if (seenContexts.has(status.context)) return false;
    seenContexts.add(status.context);
    return true;
  }).map((status) => ({
    __typename: 'StatusContext',
    context: status.context,
    state: status.state?.toUpperCase() ?? null,
    targetUrl: status.target_url,
    createdAt: status.created_at,
  }));
  const nodes = [...checkRuns, ...statuses];
  return { totalCount: Math.max(expectedTotal, nodes.length), nodes };
}

const common = `
  number url title body createdAt updatedAt
  author { login }
  labels(first: 100) { totalCount nodes { name } }
  comments(last: 100) {
    totalCount
    nodes { author { login } body createdAt updatedAt url }
  }
`;

function fetchConnection(connection, selection) {
  const nodes = [];
  const pageSize = connection === 'pullRequests' ? 10 : 50;
  let totalCount = 0;
  let cursor = null;
  do {
    const query = `query {
      repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) {
        ${connection}(states: OPEN, first: ${pageSize}, after: ${cursor ? JSON.stringify(cursor) : 'null'}, orderBy: {field: CREATED_AT, direction: ASC}) {
          totalCount
          pageInfo { hasNextPage endCursor }
          nodes { ${selection} }
        }
      }
    }`;
    const page = graphql(query)[connection];
    totalCount = page.totalCount;
    nodes.push(...page.nodes);
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);
  if (nodes.length !== totalCount) {
    throw new Error(`${connection}: expected ${totalCount} open items, fetched ${nodes.length}`);
  }
  return { totalCount, nodes };
}

function collectLiveEvidence() {
  const issueLive = fetchConnection('issues', common);
  const pullLive = fetchConnection(
    'pullRequests',
    `${common}
        isDraft headRefOid baseRefOid mergeable mergeStateStatus reviewDecision
        additions deletions changedFiles
        files(first: 100) { totalCount nodes { path additions deletions } }
        reviews(last: 100) {
          totalCount
          nodes { author { login } body state submittedAt url commit { oid } }
        }
        commits(last: 1) {
          nodes {
            commit {
              oid
              statusCheckRollup {
                state
                contexts(first: 100) {
                  totalCount
                  nodes {
                    __typename
                    ... on CheckRun { name status conclusion detailsUrl startedAt completedAt }
                    ... on StatusContext { context state targetUrl createdAt }
                  }
                }
              }
            }
          }
        }
      `,
  );

  const collected = { issues: issueLive, pullRequests: pullLive };

  for (const issue of collected.issues.nodes) {
    if (issue.labels.totalCount > issue.labels.nodes.length) {
      const labels = paginatedArray(
        `repos/${owner}/${name}/issues/${issue.number}/labels?per_page=100`,
      ).map((label) => ({ name: label.name }));
      issue.labels = { totalCount: issue.labels.totalCount, nodes: labels };
    }
    if (issue.comments.totalCount > issue.comments.nodes.length) {
      const comments = paginatedArray(
        `repos/${owner}/${name}/issues/${issue.number}/comments?per_page=100`,
      ).map(normalizeIssueComment);
      issue.comments = { totalCount: comments.length, nodes: comments };
    }
  }

  for (const pull of collected.pullRequests.nodes) {
    if (pull.labels.totalCount > pull.labels.nodes.length) {
      const labels = paginatedArray(
        `repos/${owner}/${name}/issues/${pull.number}/labels?per_page=100`,
      ).map((label) => ({ name: label.name }));
      pull.labels = { totalCount: pull.labels.totalCount, nodes: labels };
    }
    if (pull.comments.totalCount > pull.comments.nodes.length) {
      const comments = paginatedArray(
        `repos/${owner}/${name}/issues/${pull.number}/comments?per_page=100`,
      ).map(normalizeIssueComment);
      pull.comments = { totalCount: comments.length, nodes: comments };
    }
    if (pull.files.totalCount > pull.files.nodes.length) {
      const reportedTotal = pull.files.totalCount;
      const files = paginatedArray(
        `repos/${owner}/${name}/pulls/${pull.number}/files?per_page=100`,
      ).map((file) => ({
        path: file.filename,
        additions: file.additions,
        deletions: file.deletions,
      }));
      pull.files = { totalCount: reportedTotal, nodes: files };
    }
    if (pull.reviews.totalCount > pull.reviews.nodes.length) {
      const reviews = paginatedArray(
        `repos/${owner}/${name}/pulls/${pull.number}/reviews?per_page=100`,
      ).map(normalizeReview);
      pull.reviews = { totalCount: reviews.length, nodes: reviews };
    }
    const inlineComments = paginatedArray(
      `repos/${owner}/${name}/pulls/${pull.number}/comments?per_page=100`,
    ).map(normalizeReviewComment);
    const commentGroups = groupReviewThreads(inlineComments);
    const groupByCommentId = new Map();
    for (const group of commentGroups) {
      for (const comment of group.comments) groupByCommentId.set(comment.id, group);
    }
    const threadMetadata = fetchReviewThreadMetadata(pull.number);
    const matchedGroups = new Set();
    pull.reviewThreads = threadMetadata.map((thread) => {
      const groups = new Set(
        thread.commentIds.map((id) => groupByCommentId.get(id)).filter(Boolean),
      );
      if (groups.size !== (thread.commentIds.length ? 1 : 0)) {
        throw new Error(`PR #${pull.number}: review-thread comments disagree across APIs`);
      }
      const [group] = groups;
      if (group) matchedGroups.add(group);
      return {
        ...thread,
        rootId: group?.rootId ?? null,
        comments: group?.comments ?? [],
      };
    });
    if (matchedGroups.size !== commentGroups.length) {
      throw new Error(`PR #${pull.number}: REST comments and GraphQL review threads disagree`);
    }
    pull.reviewCommentCount = inlineComments.length;
    const latestCommit = pull.commits.nodes[0]?.commit;
    const contexts = latestCommit?.statusCheckRollup?.contexts;
    if (latestCommit && (contexts?.totalCount ?? 0) > (contexts?.nodes?.length ?? 0)) {
      latestCommit.statusCheckRollup.contexts = completeCheckContexts(
        latestCommit.oid,
        contexts.totalCount,
      );
    }
  }
  return collected;
}

const live = collectLiveEvidence();
const finalLive = collectLiveEvidence();
function requireStableOpenSet(kind, initial, final) {
  const initialByNumber = new Map(initial.map((item) => [item.number, item]));
  const finalByNumber = new Map(final.map((item) => [item.number, item]));
  if (
    initialByNumber.size !== finalByNumber.size ||
    [...initialByNumber.keys()].some((number) => !finalByNumber.has(number))
  ) {
    throw new Error(`${kind} open set changed during evidence collection; rerun the sync`);
  }
  return { initialByNumber, finalByNumber };
}

const issueSnapshots = requireStableOpenSet(
  'Issue',
  live.issues.nodes,
  finalLive.issues.nodes,
);
const pullSnapshots = requireStableOpenSet(
  'PR',
  live.pullRequests.nodes,
  finalLive.pullRequests.nodes,
);
for (const issue of live.issues.nodes) {
  const final = issueSnapshots.finalByNumber.get(issue.number);
  const initialFingerprint = fingerprint(normalizedSource('issue', issue), {
    includeObservedAt: true,
  });
  const finalFingerprint = fingerprint(normalizedSource('issue', final), {
    includeObservedAt: true,
  });
  if (finalFingerprint !== initialFingerprint) {
    throw new Error(`Issue #${issue.number} changed during evidence collection; rerun the sync`);
  }
}
for (const pull of live.pullRequests.nodes) {
  const final = pullSnapshots.finalByNumber.get(pull.number);
  const initialFingerprint = fingerprint(normalizedSource('pull', pull));
  const finalFingerprint = fingerprint(normalizedSource('pull', final));
  if (finalFingerprint !== initialFingerprint) {
    throw new Error(`PR #${pull.number} changed during evidence collection; rerun the sync`);
  }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function fingerprint(source, { includeObservedAt = false } = {}) {
  const materialSource = { ...source };
  if (!includeObservedAt) delete materialSource.updatedAt;
  const digest = createHash('sha256').update(JSON.stringify(stable(materialSource))).digest('hex');
  return `sha256:${digest}`;
}

function defaultReview(currentFingerprint) {
  return {
    status: 'needs-review',
    revision: null,
    reviewedAt: null,
    reviewedFingerprint: null,
    summary: '',
    priority: null,
    verdict: null,
    confidence: null,
    evidence: [],
    proposedActions: [],
    adminCapability: {
      classification: 'none',
      commandFamily: null,
      readCommand: null,
      mutationTemplate: null,
      requiredEvidence: [],
      recommendation: 'not-applicable',
    },
    clawscan: { classification: 'not-related', closureComment: null },
    pendingFingerprint: currentFingerprint,
  };
}

function normalizedSource(kind, node) {
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

mkdirSync(path.join(stateDir, 'reviews', 'issues'), { recursive: true });
mkdirSync(path.join(stateDir, 'reviews', 'pulls'), { recursive: true });
mkdirSync(path.join(stateDir, 'runs'), { recursive: true });

const summary = { repository, generatedAt: new Date().toISOString(), issues: {}, pulls: {} };

function syncKind(kind, nodes) {
  const folder = kind === 'issue' ? 'issues' : 'pulls';
  const counts = { open: nodes.length, created: 0, changed: 0, unchanged: 0 };
  for (const node of nodes) {
    const file = path.join(stateDir, 'reviews', folder, `${node.number}.json`);
    const source = normalizedSource(kind, node);
    const fingerprintOptions = { includeObservedAt: kind === 'issue' };
    const currentFingerprint = fingerprint(source, fingerprintOptions);
    let record;
    if (!existsSync(file)) {
      record = {
        schemaVersion: 1,
        repository,
        kind,
        number: node.number,
        url: node.url,
        fingerprint: currentFingerprint,
        fingerprintVersion: 3,
        source,
        review: defaultReview(currentFingerprint),
        actions: [],
        history: [],
        lifecycle: { state: 'open', lastSeenOpenAt: summary.generatedAt },
      };
      counts.created += 1;
    } else {
      record = JSON.parse(readFileSync(file, 'utf8'));
      if (record.repository !== repository || record.kind !== kind || record.number !== node.number) {
        throw new Error(`${folder}/${node.number}.json does not belong to ${repository} ${kind}`);
      }
      if (REVIEW_STATUSES.has(record.review?.status)) {
        const expectedRevision = reviewRevision(record.review);
        if (record.review.revision && record.review.revision !== expectedRevision) {
          throw new Error(`${folder}/${node.number}.json has a stale review revision`);
        }
        record.review.revision = expectedRevision;
      }
      const storedMaterialFingerprint = fingerprint(record.source ?? {}, fingerprintOptions);
      const storedLegacyFingerprint = fingerprint(record.source ?? {}, { includeObservedAt: true });
      const storedV2Fingerprint = fingerprint(record.source ?? {});
      const canMigrateLegacyFingerprint =
        (record.fingerprintVersion ?? 1) === 1 &&
        record.fingerprint === storedLegacyFingerprint &&
        storedMaterialFingerprint === currentFingerprint;
      const canMigrateIssueFingerprint =
        kind === 'issue' &&
        record.fingerprintVersion === 2 &&
        record.fingerprint === storedV2Fingerprint &&
        storedMaterialFingerprint === currentFingerprint;
      const canMigrateFingerprint = canMigrateLegacyFingerprint || canMigrateIssueFingerprint;
      const reopened = record.lifecycle?.state === 'not-open';
      if (!reopened && canMigrateFingerprint) {
        const previousFingerprint = record.fingerprint;
        const previousReview = REVIEW_STATUSES.has(record.review?.status)
          ? JSON.parse(JSON.stringify(record.review))
          : null;
        record.fingerprint = currentFingerprint;
        record.fingerprintVersion = 3;
        if (record.review?.reviewedFingerprint === previousFingerprint) {
          record.review.reviewedFingerprint = currentFingerprint;
        }
        for (const action of record.review?.proposedActions ?? []) {
          if (action.targetFingerprint === previousFingerprint) {
            action.targetFingerprint = currentFingerprint;
          }
        }
        if (REVIEW_STATUSES.has(record.review?.status)) {
          record.review.revision = reviewRevision(record.review);
          if (previousReview?.revision !== record.review.revision) {
            record.reviewHistory ??= [];
            record.reviewHistory.push({
              revision: previousReview.revision,
              review: previousReview,
              supersededAt: summary.generatedAt,
              reason: 'source fingerprint schema migration',
            });
          }
        }
        record.fingerprintMigrations ??= [];
        record.fingerprintMigrations.push({
          from: previousFingerprint,
          to: currentFingerprint,
          version: 3,
          migratedAt: summary.generatedAt,
          reason:
            kind === 'issue'
              ? 'retain top-level GitHub updatedAt for conservative issue freshness'
              : 'exclude top-level GitHub updatedAt from material PR freshness',
        });
        record.source = source;
        counts.unchanged += 1;
      } else if (!reopened && record.fingerprint === currentFingerprint) {
        record.source = source;
        record.fingerprintVersion = 3;
        counts.unchanged += 1;
      } else {
        record.history ??= [];
        record.history.push({
          fingerprint: record.fingerprint,
          fingerprintVersion: record.fingerprintVersion ?? 1,
          source: record.source,
          review: record.review,
          supersededAt: new Date().toISOString(),
          reason: reopened ? 'item reopened' : 'material review surface changed',
        });
        record.fingerprint = currentFingerprint;
        record.fingerprintVersion = 3;
        record.source = source;
        record.review = defaultReview(currentFingerprint);
        counts.changed += 1;
      }
      record.url = node.url;
      record.lifecycle = { state: 'open', lastSeenOpenAt: summary.generatedAt };
    }
    writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
  }
  const openNumbers = new Set(nodes.map((node) => node.number));
  counts.notOpenRecords = 0;
  const directory = path.join(stateDir, 'reviews', folder);
  for (const filename of readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
    const number = Number.parseInt(filename, 10);
    if (openNumbers.has(number)) continue;
    const file = path.join(directory, filename);
    const record = JSON.parse(readFileSync(file, 'utf8'));
    if (record.repository !== repository) continue;
    record.lifecycle = {
      state: 'not-open',
      lastSeenOpenAt: record.lifecycle?.lastSeenOpenAt ?? null,
      observedNotOpenAt: summary.generatedAt,
    };
    writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
    counts.notOpenRecords += 1;
  }
  summary[folder] = counts;
}

syncKind('issue', live.issues.nodes);
syncKind('pull', live.pullRequests.nodes);
writeFileSync(path.join(stateDir, 'sync-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
