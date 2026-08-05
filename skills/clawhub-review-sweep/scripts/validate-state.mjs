#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { reviewProblems } from './review-schema.mjs';

const args = process.argv.slice(2);
const stateIndex = args.indexOf('--state');
const stateDir = stateIndex >= 0 ? args[stateIndex + 1] : '';
if (!stateDir) throw new Error('Usage: validate-state.mjs --state <checkout>');

const summaryPath = path.join(stateDir, 'sync-summary.json');
if (!existsSync(summaryPath)) throw new Error('sync-summary.json is missing; run sync first');
const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const problems = [];

for (const [folder, expected] of [
  ['issues', summary.issues.open],
  ['pulls', summary.pulls.open],
]) {
  const directory = path.join(stateDir, 'reviews', folder);
  const files = readdirSync(directory).filter((file) => file.endsWith('.json'));
  let current = 0;
  for (const file of files) {
    const record = JSON.parse(readFileSync(path.join(directory, file), 'utf8'));
    if (record.repository !== summary.repository) continue;
    if (record.lifecycle?.state !== 'open') continue;
    if (record.review?.reviewedFingerprint === record.fingerprint) current += 1;
    else problems.push(`${folder}/${file}: review is not current`);
    for (const problem of reviewProblems(record.review, record.fingerprint)) {
      problems.push(`${folder}/${file}: ${problem}`);
    }
    const checkContexts = record.source?.latestCommit?.statusCheckRollup?.contexts;
    const evidenceTruncated =
      record.source?.commentsTruncated === true ||
      record.source?.labelsTruncated === true ||
      record.source?.filesTruncated === true ||
      record.source?.reviewsTruncated === true ||
      (checkContexts?.totalCount ?? 0) > (checkContexts?.nodes?.length ?? 0);
    if (record.review?.status === 'complete' && evidenceTruncated) {
      problems.push(`${folder}/${file}: complete review has truncated GitHub evidence`);
    }
  }
  if (current !== expected) problems.push(`${folder}: expected ${expected} current reviews, found ${current}`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`validated ${summary.issues.open} issues and ${summary.pulls.open} pull requests`);
