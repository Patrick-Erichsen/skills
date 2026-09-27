import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AUTOLAND_POLICY_ID,
  reviewProblems,
  reviewRevision,
} from './review-schema.mjs';

const fingerprint = 'sha256:current-source';
const autoland = {
  policyId: AUTOLAND_POLICY_ID,
  contract: 'Only active admins may queue catalog scans.',
  eligibilityEvidence: ['The adjacent catalog maintenance entry point uses the active-admin guard.'],
};

function action(type, approvalStatus, details = {}) {
  return {
    type,
    summary: `${type} the bounded catalog repair`,
    targetFingerprint: fingerprint,
    public: !['investigate', 'none'].includes(type),
    approvalStatus,
    ...details,
  };
}

function review(actions, changes = {}) {
  const result = {
    status: 'complete',
    reviewedFingerprint: fingerprint,
    summary: 'The existing active-admin contract is missing from one entry point.',
    priority: 'p1',
    verdict: 'repairable-proof-gap',
    confidence: 'high',
    blockedReason: null,
    evidence: ['The current caller reaches a scan enqueue without the established guard.'],
    proposedActions: actions,
    adminCapability: {
      classification: 'none',
      commandFamily: null,
      readCommand: null,
      mutationTemplate: null,
      requiredEvidence: [],
      recommendation: 'not-applicable',
    },
    clawscan: { classification: 'not-related', closureComment: null },
    ...changes,
  };
  result.revision = reviewRevision(result);
  return result;
}

test('existing human-gated records remain valid', () => {
  const item = review([action('merge', 'awaiting-patrick-review')]);
  assert.deepEqual(reviewProblems(item, fingerprint), []);
});

test('bounded repair can enter the autoland lane before proof is complete', () => {
  const item = review([action('repair', 'autoland-candidate', { autoland })]);
  assert.deepEqual(reviewProblems(item, fingerprint), []);
});

test('merge needs a qualified revision with real proof and validation references', () => {
  const candidate = review([action('merge', 'autoland-candidate', { autoland })]);
  assert.match(reviewProblems(candidate, fingerprint).join('; '), /cannot execute before qualification/);

  const unproven = review([action('merge', 'autoland-qualified', { autoland })]);
  const errors = reviewProblems(unproven, fingerprint).join('; ');
  assert.match(errors, /before\/after or baseline proof/);
  assert.match(errors, /completed validation/);

  const proven = review([
    action('merge', 'autoland-qualified', {
      autoland: {
        ...autoland,
        proof: ['Native Convex anonymous/member denial and admin success: run artifact URL'],
        validation: ['Exact final head: required checks and repository typechecks passed'],
      },
    }),
  ]);
  assert.deepEqual(reviewProblems(proven, fingerprint), []);
  assert.match(reviewProblems(proven, 'sha256:changed-source').join('; '), /stale fingerprint/);
});

test('policy text cannot authorize admin commands, moderation, or public reviews', () => {
  for (const type of ['admin-command', 'review']) {
    const item = review([action(type, 'autoland-qualified', {
      autoland: { ...autoland, proof: ['Observed result'], validation: ['Required checks passed'] },
    })]);
    assert.match(reviewProblems(item, fingerprint).join('; '), /outside the autoland action set/);
  }

  const moderation = review(
    [action('close', 'autoland-qualified', {
      autoland: { ...autoland, proof: ['Observed result'], validation: ['Required checks passed'] },
    })],
    { clawscan: { classification: 'moderation-or-abuse', closureComment: null } },
  );
  assert.match(reviewProblems(moderation, fingerprint).join('; '), /moderation cannot use autoland/);
});

test('missing policy evidence and blocked reviews cannot enter autoland', () => {
  const unsupported = review([action('repair', 'autoland-candidate', {
    autoland: { ...autoland, policyId: 'unreviewed-policy', eligibilityEvidence: [] },
  })]);
  const errors = reviewProblems(unsupported, fingerprint).join('; ');
  assert.match(errors, /agreed ClawHub policy ID/);
  assert.match(errors, /eligibility evidence/);

  const blocked = review([action('repair', 'autoland-candidate', { autoland })], {
    status: 'blocked',
    blockedReason: 'The contract is still undecided.',
  });
  assert.match(reviewProblems(blocked, fingerprint).join('; '), /needs a complete review/);

  const malformed = review([action('repair', { unexpected: 'status' })]);
  assert.match(reviewProblems(malformed, fingerprint).join('; '), /invalid approval status/);
});
