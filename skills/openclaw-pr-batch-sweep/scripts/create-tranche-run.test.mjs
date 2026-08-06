#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./create-tranche-run.mjs", import.meta.url));
const mainSha = "1".repeat(40);

function pullRequest(number) {
  return {
    number,
    title: `fix: candidate ${number}`,
    author: { login: `author-${number}` },
    headRefOid: number.toString(16).padStart(40, "0"),
    url: `https://github.com/openclaw/openclaw/pull/${number}`,
  };
}

function fixture() {
  const directory = mkdtempSync(path.join(tmpdir(), "openclaw-tranches-"));
  const inputPath = path.join(directory, "snapshot.json");
  const ledgerPath = path.join(directory, "decision-ledger.json");
  const ledgerOutputPath = path.join(directory, "decision-ledger.next.json");
  const outputDir = path.join(directory, "run");
  writeFileSync(inputPath, JSON.stringify(Array.from({ length: 6 }, (_, index) => pullRequest(index + 1))));
  writeFileSync(
    ledgerPath,
    JSON.stringify({
      schemaVersion: 2,
      auditWatermark: { openPrThrough: 100 },
      backlogCursor: { nextPrBefore: 50 },
      candidateQueue: [],
    }),
  );
  return { directory, inputPath, ledgerPath, ledgerOutputPath, outputDir };
}

function run(paths, extra = []) {
  return spawnSync(
    process.execPath,
    [
      scriptPath,
      "--input",
      paths.inputPath,
      "--decision-ledger",
      paths.ledgerPath,
      "--ledger-output",
      paths.ledgerOutputPath,
      "--output-dir",
      paths.outputDir,
      "--run-id",
      "2026-08-05-parallel-6",
      "--origin-main",
      mainSha,
      "--tranches",
      "3",
      "--tranche-size",
      "2",
      "--created-at",
      "2026-08-05T20:00:00.000Z",
      ...extra,
    ],
    { encoding: "utf8" },
  );
}

test("creates contiguous non-overlapping manifests and durable reservations", () => {
  const paths = fixture();
  try {
    const result = run(paths);
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.deepEqual(summary.laneCounts, [2, 2, 2]);
    assert.equal(summary.reservationCount, 6);

    const lane1 = JSON.parse(readFileSync(path.join(paths.outputDir, "lane-01.json"), "utf8"));
    const lane2 = JSON.parse(readFileSync(path.join(paths.outputDir, "lane-02.json"), "utf8"));
    const lane3 = JSON.parse(readFileSync(path.join(paths.outputDir, "lane-03.json"), "utf8"));
    assert.deepEqual(lane1.assigned.map((pr) => pr.number), [1, 2]);
    assert.deepEqual(lane2.assigned.map((pr) => pr.number), [3, 4]);
    assert.deepEqual(lane3.assigned.map((pr) => pr.number), [5, 6]);
    assert.equal(new Set([lane1.manifestHash, lane2.manifestHash, lane3.manifestHash]).size, 3);

    const nextLedger = JSON.parse(readFileSync(paths.ledgerOutputPath, "utf8"));
    assert.equal(nextLedger.schemaVersion, 3);
    assert.equal(nextLedger.activeReservations.length, 6);
    assert.equal(nextLedger.parallelRuns[0].runId, "2026-08-05-parallel-6");
  } finally {
    rmSync(paths.directory, { recursive: true, force: true });
  }
});

test("fails closed when a selected PR is already reserved", () => {
  const paths = fixture();
  try {
    writeFileSync(
      paths.ledgerPath,
      JSON.stringify({
        schemaVersion: 3,
        activeReservations: [
          {
            number: 3,
            headSha: pullRequest(3).headRefOid,
            runId: "existing-run",
            laneId: "lane-01",
          },
        ],
      }),
    );
    const result = run(paths);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /PR #3 is already reserved/);
  } finally {
    rmSync(paths.directory, { recursive: true, force: true });
  }
});

test("requires enough exact-head PRs to fill every tranche", () => {
  const paths = fixture();
  try {
    writeFileSync(paths.inputPath, JSON.stringify([pullRequest(1), pullRequest(2)]));
    const result = run(paths);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /2 unique PRs; 6 are required/);
  } finally {
    rmSync(paths.directory, { recursive: true, force: true });
  }
});
