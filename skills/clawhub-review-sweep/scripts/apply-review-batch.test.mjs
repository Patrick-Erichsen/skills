import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AUTOLAND_POLICY_ID } from './review-schema.mjs';

const script = fileURLToPath(new URL('./apply-review-batch.mjs', import.meta.url));
const fingerprint = 'sha256:reviewed-head';
const basis = {
  policyId: AUTOLAND_POLICY_ID,
  contract: 'Admin-only catalog maintenance keeps internal continuation access.',
  eligibilityEvidence: ['Current source: the adjacent maintenance mutation uses this guard.'],
};

test('batch writer retains human route and rejects unproven autoland merge without changing the record', () => {
  const state = mkdtempSync(path.join(tmpdir(), 'clawhub-review-'));
  try {
    const directory = path.join(state, 'reviews', 'pulls');
    mkdirSync(directory, { recursive: true });
    const recordPath = path.join(directory, '41.json');
    const inputPath = path.join(state, 'batch.json');
    writeFileSync(recordPath, JSON.stringify({
      repository: 'openclaw/clawhub',
      kind: 'pull',
      number: 41,
      fingerprint,
      lifecycle: { state: 'open' },
      review: { status: 'needs-review' },
      reviewHistory: [],
    }));

    const base = {
      kind: 'pull',
      number: 41,
      fingerprint,
      status: 'complete',
      summary: 'The PR restores the existing admin contract.',
      priority: 'p1',
      verdict: 'repairable-proof-gap',
      confidence: 'high',
      evidence: ['The current source has an unguarded queue entry point.'],
    };
    const apply = (proposedActions) => {
      writeFileSync(inputPath, JSON.stringify([{ ...base, proposedActions }]));
      return spawnSync(process.execPath, [script, '--state', state, '--input', inputPath], {
        encoding: 'utf8',
      });
    };

    let result = apply([{
      type: 'repair',
      summary: 'Add the existing admin guard and prove both denial and success.',
      approvalStatus: 'autoland-candidate',
      autoland: basis,
    }]);
    assert.equal(result.status, 0, result.stderr);
    let written = readFileSync(recordPath, 'utf8');
    assert.equal(JSON.parse(written).review.proposedActions[0].approvalStatus, 'autoland-candidate');

    result = apply([{
      type: 'merge',
      summary: 'Merge the repair.',
      approvalStatus: 'autoland-qualified',
      autoland: basis,
    }]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /before\/after or baseline proof/);
    assert.equal(readFileSync(recordPath, 'utf8'), written);

    result = apply([{
      type: 'merge',
      summary: 'Merge the proven repair.',
      approvalStatus: 'autoland-qualified',
      autoland: {
        ...basis,
        proof: ['Native denied and admin calls against a populated queue: artifact URL'],
        validation: ['Final revision: static, unit, types and required checks passed'],
      },
    }]);
    assert.equal(result.status, 0, result.stderr);
    written = readFileSync(recordPath, 'utf8');
    assert.equal(JSON.parse(written).review.proposedActions[0].approvalStatus, 'autoland-qualified');

    result = apply([{ type: 'merge', summary: 'Route a different case to Patrick.' }]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      JSON.parse(readFileSync(recordPath, 'utf8')).review.proposedActions[0].approvalStatus,
      'awaiting-patrick-review',
    );
  } finally {
    rmSync(state, { recursive: true, force: true });
  }
});
