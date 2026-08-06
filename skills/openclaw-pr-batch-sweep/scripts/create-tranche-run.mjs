#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
let inputPath = "";
let decisionLedgerPath = "";
let ledgerOutputPath = "";
let outputDir = "";
let runId = "";
let repository = "openclaw/openclaw";
let originMain = "";
let trancheCount = 3;
let trancheSize = 50;
let leaseHours = 72;
let createdAt = "";

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--input") inputPath = args[++index] ?? "";
  else if (arg === "--decision-ledger") decisionLedgerPath = args[++index] ?? "";
  else if (arg === "--ledger-output") ledgerOutputPath = args[++index] ?? "";
  else if (arg === "--output-dir") outputDir = args[++index] ?? "";
  else if (arg === "--run-id") runId = args[++index] ?? "";
  else if (arg === "--repository") repository = args[++index] ?? "";
  else if (arg === "--origin-main") originMain = args[++index] ?? "";
  else if (arg === "--tranches") trancheCount = Number.parseInt(args[++index] ?? "3", 10);
  else if (arg === "--tranche-size") trancheSize = Number.parseInt(args[++index] ?? "50", 10);
  else if (arg === "--lease-hours") leaseHours = Number.parseInt(args[++index] ?? "72", 10);
  else if (arg === "--created-at") createdAt = args[++index] ?? "";
  else if (arg === "--help") {
    console.log(
      "Usage: create-tranche-run.mjs --input snapshot.json --decision-ledger decision-ledger.json --ledger-output decision-ledger.next.json --output-dir runs/<run-id> --run-id <id> --origin-main <sha> [--tranches 3] [--tranche-size 50] [--lease-hours 72]",
    );
    process.exit(0);
  } else throw new Error(`Unknown argument: ${arg}`);
}

if (!inputPath) throw new Error("--input is required");
if (!decisionLedgerPath) throw new Error("--decision-ledger is required");
if (!ledgerOutputPath) throw new Error("--ledger-output is required");
if (!outputDir) throw new Error("--output-dir is required");
if (!/^[a-z0-9][a-z0-9._-]{2,80}$/i.test(runId)) throw new Error("--run-id is invalid");
if (!/^[^/]+\/[^/]+$/.test(repository)) throw new Error("--repository must be owner/name");
if (!/^[0-9a-f]{40}$/i.test(originMain)) throw new Error("--origin-main must be a 40-character SHA");
if (!Number.isInteger(trancheCount) || trancheCount < 2 || trancheCount > 5) {
  throw new Error("--tranches must be an integer from 2 to 5");
}
if (!Number.isInteger(trancheSize) || trancheSize < 1 || trancheSize > 100) {
  throw new Error("--tranche-size must be an integer from 1 to 100");
}
if (!Number.isInteger(leaseHours) || leaseHours < 1 || leaseHours > 168) {
  throw new Error("--lease-hours must be an integer from 1 to 168");
}
if (existsSync(outputDir)) throw new Error(`Output directory already exists: ${outputDir}`);
if (existsSync(ledgerOutputPath)) throw new Error(`Ledger output already exists: ${ledgerOutputPath}`);

const parsedInput = JSON.parse(readFileSync(inputPath, "utf8"));
const rawPullRequests = Array.isArray(parsedInput) ? parsedInput : parsedInput.threads;
if (!Array.isArray(rawPullRequests)) {
  throw new Error('Expected a PR array or a {"threads": [...]} envelope');
}
const ledger = JSON.parse(readFileSync(decisionLedgerPath, "utf8"));
const timestamp = createdAt || new Date().toISOString();
if (Number.isNaN(Date.parse(timestamp))) throw new Error("--created-at must be an ISO timestamp");
const leaseUntil = new Date(Date.parse(timestamp) + leaseHours * 60 * 60 * 1000).toISOString();

function sha256(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function authorLogin(pr) {
  if (typeof pr.author === "string") return pr.author;
  return String(pr.author?.login ?? pr.author_login ?? "");
}

function normalize(pr) {
  const number = Number(pr.number);
  const headSha = String(pr.headSha ?? pr.headRefOid ?? pr.head_sha ?? pr.head?.sha ?? "");
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Invalid PR number: ${String(pr.number)}`);
  }
  if (!/^[0-9a-f]{40}$/i.test(headSha)) {
    throw new Error(`PR #${number} is missing an exact 40-character head SHA`);
  }
  return {
    number,
    url: String(pr.url ?? pr.html_url ?? `https://github.com/${repository}/pull/${number}`),
    title: String(pr.title ?? ""),
    authorLogin: authorLogin(pr),
    headSha: headSha.toLowerCase(),
  };
}

const unique = new Map();
for (const raw of rawPullRequests) {
  const kind = String(raw.kind ?? "").toLowerCase();
  if (kind && !["pull_request", "pull", "pr"].includes(kind)) continue;
  const pr = normalize(raw);
  if (unique.has(pr.number)) throw new Error(`Duplicate PR #${pr.number} in snapshot`);
  unique.set(pr.number, pr);
}

const targetCount = trancheCount * trancheSize;
if (unique.size < targetCount) {
  throw new Error(`Snapshot has ${unique.size} unique PRs; ${targetCount} are required`);
}
const selected = [...unique.values()].slice(0, targetCount);

const terminalNumbers = new Set();
for (const key of ["explicitSkips", "landed", "handledMerged", "closed", "rejected", "ignored"]) {
  for (const entry of ledger[key] ?? []) {
    terminalNumbers.add(Number(typeof entry === "object" && entry !== null ? entry.number : entry));
  }
}
const queuedHeads = new Map(
  (ledger.candidateQueue ?? [])
    .filter((entry) => entry.status !== "superseded")
    .map((entry) => [Number(entry.number), String(entry.headSha ?? "").toLowerCase()]),
);
const activeReservations = ledger.activeReservations ?? [];
if (!Array.isArray(activeReservations)) {
  throw new Error("Decision ledger field activeReservations must be an array");
}
const reservedNumbers = new Set();
for (const entry of activeReservations) {
  const number = Number(entry?.number);
  const headSha = String(entry?.headSha ?? "");
  const existingRunId = String(entry?.runId ?? "");
  const laneId = String(entry?.laneId ?? "");
  if (
    !Number.isInteger(number) ||
    number < 1 ||
    !/^[0-9a-f]{40}$/i.test(headSha) ||
    !existingRunId ||
    !laneId
  ) {
    throw new Error(`Invalid active reservation: ${JSON.stringify(entry)}`);
  }
  reservedNumbers.add(number);
}
for (const pr of selected) {
  if (terminalNumbers.has(pr.number)) throw new Error(`PR #${pr.number} is terminally handled`);
  if (queuedHeads.get(pr.number) === pr.headSha) {
    throw new Error(`PR #${pr.number} is already queued at this head`);
  }
  if (reservedNumbers.has(pr.number)) throw new Error(`PR #${pr.number} is already reserved`);
}
const parallelRuns = ledger.parallelRuns ?? [];
if (!Array.isArray(parallelRuns)) {
  throw new Error("Decision ledger field parallelRuns must be an array");
}
if (parallelRuns.some((run) => run.runId === runId)) {
  throw new Error(`Parallel run already exists: ${runId}`);
}

const lanes = [];
const reservations = [];
for (let index = 0; index < trancheCount; index += 1) {
  const laneId = `lane-${String(index + 1).padStart(2, "0")}`;
  const assigned = selected.slice(index * trancheSize, (index + 1) * trancheSize);
  const manifestHash = sha256({ runId, laneId, repository, assigned });
  const file = `${laneId}.json`;
  lanes.push({ laneId, file, count: assigned.length, manifestHash, status: "reserved" });
  for (const pr of assigned) {
    reservations.push({
      number: pr.number,
      headSha: pr.headSha,
      runId,
      laneId,
      reservedAt: timestamp,
      leaseUntil,
    });
  }
}

const manifest = {
  schemaVersion: 1,
  mode: "parallel-tranches",
  runId,
  repository,
  status: "reserved",
  createdAt: timestamp,
  leaseUntil,
  originMain: originMain.toLowerCase(),
  trancheCount,
  trancheSize,
  snapshotCount: selected.length,
  snapshotHash: sha256(selected),
  sourceCursor: {
    auditWatermark: ledger.auditWatermark ?? null,
    backlogCursor: ledger.backlogCursor ?? null,
  },
  lanes,
};

mkdirSync(outputDir, { recursive: false });
writeFileSync(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
for (let index = 0; index < lanes.length; index += 1) {
  const lane = lanes[index];
  const assigned = selected.slice(index * trancheSize, (index + 1) * trancheSize);
  writeFileSync(
    path.join(outputDir, lane.file),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        runId,
        laneId: lane.laneId,
        repository,
        dispatcherThreadId: null,
        threadId: null,
        status: "reserved",
        createdAt: timestamp,
        updatedAt: timestamp,
        leaseUntil,
        manifestHash: lane.manifestHash,
        assigned,
        screened: [],
        candidateQueue: [],
        outcomes: [],
      },
      null,
      2,
    )}\n`,
  );
}

const nextLedger = {
  ...ledger,
  schemaVersion: Math.max(Number(ledger.schemaVersion ?? 0), 3),
  activeReservations: [...activeReservations, ...reservations],
  parallelRuns: [
    ...parallelRuns,
    {
      runId,
      status: "reserved",
      createdAt: timestamp,
      leaseUntil,
      manifest: `runs/${path.basename(outputDir)}/manifest.json`,
      count: selected.length,
    },
  ],
};
writeFileSync(ledgerOutputPath, `${JSON.stringify(nextLedger, null, 2)}\n`);

console.log(
  JSON.stringify({
    runId,
    snapshotCount: selected.length,
    trancheCount,
    trancheSize,
    laneCounts: lanes.map((lane) => lane.count),
    snapshotHash: manifest.snapshotHash,
    reservationCount: reservations.length,
  }),
);
