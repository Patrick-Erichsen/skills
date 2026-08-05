#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  REVIEW_STATUSES,
  actionIsExternal,
  reviewProblems,
  reviewRevision,
} from './review-schema.mjs';

const args = process.argv.slice(2);
const stateIndex = args.indexOf('--state');
const inputIndex = args.indexOf('--input');
const stateDir = stateIndex >= 0 ? args[stateIndex + 1] : '';
const inputPath = inputIndex >= 0 ? args[inputIndex + 1] : '';
if (!stateDir || !inputPath) {
  throw new Error('Usage: apply-review-batch.mjs --state <checkout> --input <reviews.json>');
}

const updates = JSON.parse(readFileSync(inputPath, 'utf8'));
if (!Array.isArray(updates)) throw new Error('Review batch must be a JSON array');
const seen = new Set();
const reviewedAt = new Date().toISOString();
const prepared = [];

for (const update of updates) {
  const kind = update.kind;
  const number = Number(update.number);
  const key = `${kind}:${number}`;
  if (!['issue', 'pull'].includes(kind) || !Number.isInteger(number) || number < 1) {
    throw new Error(`Invalid review identity: ${JSON.stringify(update)}`);
  }
  if (seen.has(key)) throw new Error(`Duplicate review update: ${key}`);
  seen.add(key);
  const folder = kind === 'issue' ? 'issues' : 'pulls';
  const file = path.join(stateDir, 'reviews', folder, `${number}.json`);
  const record = JSON.parse(readFileSync(file, 'utf8'));
  if (record.lifecycle?.state !== 'open') {
    throw new Error(`${key}: item is no longer open`);
  }
  if (typeof update.fingerprint !== 'string' || !update.fingerprint.startsWith('sha256:')) {
    throw new Error(`${key}: current fingerprint is required`);
  }
  if (update.fingerprint !== record.fingerprint) {
    throw new Error(`${key} changed before review was applied`);
  }
  const previousReview = record.review;
  const nextReview = {
    status: update.status,
    reviewedAt,
    reviewedFingerprint: record.fingerprint,
    summary: update.summary,
    priority: update.priority,
    verdict: update.verdict,
    confidence: update.confidence,
    blockedReason: update.status === 'blocked' ? update.blockedReason : null,
    evidence: update.evidence,
    proposedActions: (update.proposedActions ?? []).map((action) => ({
      type: action.type,
      targetFingerprint: record.fingerprint,
      summary: action.summary,
      public: actionIsExternal(action.type),
      approvalStatus: 'awaiting-patrick-review',
    })),
    adminCapability: {
      classification: 'none',
      commandFamily: null,
      readCommand: null,
      mutationTemplate: null,
      requiredEvidence: [],
      recommendation: 'not-applicable',
      ...(update.adminCapability ?? {}),
    },
    clawscan: {
      classification: 'not-related',
      closureComment: null,
      ...(update.clawscan ?? {}),
    },
  };
  nextReview.revision = reviewRevision(nextReview);
  const previousRevision = REVIEW_STATUSES.has(previousReview?.status)
    ? (previousReview.revision ?? reviewRevision(previousReview))
    : null;
  if (previousRevision && previousRevision !== nextReview.revision) {
    record.reviewHistory ??= [];
    record.reviewHistory.push({
      revision: previousRevision,
      review: { ...previousReview, revision: previousRevision },
      supersededAt: reviewedAt,
      reason: 'review revised at unchanged source fingerprint',
    });
  }
  record.review = nextReview;
  const problems = reviewProblems(record.review, record.fingerprint);
  if (problems.length) throw new Error(`${key}: ${problems.join('; ')}`);
  prepared.push({ file, record });
}

for (const { file, record } of prepared) {
  writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
}

console.log(`applied ${updates.length} current reviews at ${reviewedAt}`);
