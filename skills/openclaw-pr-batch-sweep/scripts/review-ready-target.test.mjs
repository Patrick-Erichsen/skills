import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");

const [skill, prepareContract, ranker] = await Promise.all([
  readFile(path.join(skillDir, "SKILL.md"), "utf8"),
  readFile(path.join(skillDir, "references/prepare-for-review.md"), "utf8"),
  readFile(path.join(scriptDir, "rank-candidates.mjs"), "utf8"),
]);

test("prepare-for-review defaults to and caps genuinely review-ready output at ten", () => {
  assert.match(
    skill,
    /`review_ready_target`: default `10`, maximum `10`, only in explicitly opted-in `prepare-for-review` mode\./,
  );
  assert.match(skill, /In `prepare-for-review`, up to 10 exact-head, independently verified review-ready PRs/);
  assert.match(prepareContract, /defaulting to 10 and never exceeding 10/);
  assert.doesNotMatch(skill, /prepare-for-review[^\n]*up to 20/i);
  assert.doesNotMatch(prepareContract, /review_ready_target[^\n]*20/);
});

test("standard proposal and screening capacity remain twenty", () => {
  assert.match(skill, /build a 20-item proposal queue for operator approval/);
  assert.match(skill, /`candidate_target`: default `20`, maximum `20` in standard or manifest mode\./);
  assert.match(skill, /Approval queue with up to 20 candidate cards and no padding in standard or manifest mode\./);
  assert.match(ranker, /let batchSize = 20;/);
  assert.match(ranker, /batchSize > 20/);
  assert.match(ranker, /--batch-size must be an integer from 1 to 20/);
});

test("the mode remains scoped to openclaw/openclaw and preserves no-padding guardrails", () => {
  assert.match(skill, /`repo`: default `openclaw\/openclaw`\./);
  assert.match(prepareContract, /Do not pad the result or lower evidence, safety, ownership, or proof standards/);
  assert.match(prepareContract, /never push to the contributor branch/);
  assert.match(prepareContract, /stop before approval, merge, deployment, or release/i);
});
