#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
let inputPath = "";
let outputPath = "";
let repo = "openclaw/openclaw";
let limit = 40;
let sleepMs = 2000;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--input") {
    inputPath = args[++index] ?? "";
  } else if (arg === "--output") {
    outputPath = args[++index] ?? "";
  } else if (arg === "--repo") {
    repo = args[++index] ?? "";
  } else if (arg === "--limit") {
    limit = Number.parseInt(args[++index] ?? "40", 10);
  } else if (arg === "--sleep-ms") {
    sleepMs = Number.parseInt(args[++index] ?? "2000", 10);
  } else if (arg === "--help") {
    console.log(
      "Usage: hydrate-candidates.mjs --input ranked.json [--output hydrated.json] [--repo owner/name] [--limit 40] [--sleep-ms 2000]",
    );
    process.exit(0);
  } else {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

if (!inputPath) throw new Error("--input is required");
if (!/^[^/]+\/[^/]+$/.test(repo)) throw new Error("--repo must be owner/name");
if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
  throw new Error("--limit must be an integer from 1 to 100");
}
if (!Number.isInteger(sleepMs) || sleepMs < 0 || sleepMs > 30_000) {
  throw new Error("--sleep-ms must be an integer from 0 to 30000");
}

const ghxAvailable = spawnSync("ghx", ["--version"], { stdio: "ignore" }).status === 0;
const ghxBin = process.env.GHX_BIN || (ghxAvailable ? "ghx" : "gh");
const commandEnv = {
  ...process.env,
  NO_COLOR: "1",
  CLICOLOR: "0",
  CLICOLOR_FORCE: "0",
  GH_FORCE_TTY: "0",
};

const transientFailurePattern =
  /(?:TLS handshake timeout|connection reset|connection refused|EOF|HTTP 5\d\d|server closed idle connection|temporary failure|timeout)/i;
const notFoundFailurePattern = /(?:HTTP 404|Not Found|Could not resolve to a PullRequest)/i;
const maxTransientAttempts = 5;
let maintainerPermissionMap;

function runJson(commandArgs) {
  for (let attempt = 1; attempt <= maxTransientAttempts; attempt += 1) {
    const result = spawnSync(ghxBin, commandArgs, {
      encoding: "utf8",
      env: commandEnv,
      maxBuffer: 20 * 1024 * 1024,
    });
    if (result.status === 0) {
      return JSON.parse(result.stdout);
    }

    const detail = result.stderr.trim() || result.stdout.trim();
    const notFound = notFoundFailurePattern.test(detail);
    const transient = transientFailurePattern.test(detail);
    if (!transient) {
      const error = new Error(`${ghxBin} ${commandArgs.join(" ")} failed: ${detail}`);
      error.notFound = notFound;
      throw error;
    }
    if (attempt === maxTransientAttempts) {
      const error = new Error(`${ghxBin} ${commandArgs.join(" ")} failed: ${detail}`);
      error.transient = true;
      throw error;
    }
    const retryDelayMs = Math.min(sleepMs * attempt, 30_000);
    process.stderr.write(
      `${ghxBin} ${commandArgs.join(" ")} transient failure; retry ${attempt + 1}/${maxTransientAttempts} in ${retryDelayMs}ms\n`,
    );
    sleep(retryDelayMs);
  }

  throw new Error("unreachable");
}

function sleep(durationMs) {
  if (durationMs === 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, durationMs);
}

function candidateArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  for (const key of ["hydrationPool", "selected", "threads"]) {
    if (Array.isArray(parsed[key])) return parsed[key];
  }
  throw new Error("Expected an array or an object with hydrationPool, selected, or threads");
}

function unresolvedMergeability(pr) {
  return pr.mergeable === null || String(pr.mergeable_state ?? "").toLowerCase() === "unknown";
}

function fetchPages(endpoint) {
  const entries = [];
  for (let page = 1; ; page += 1) {
    const separator = endpoint.includes("?") ? "&" : "?";
    const pageEntries = runJson(["api", `${endpoint}${separator}per_page=25&page=${page}`]);
    if (!Array.isArray(pageEntries)) {
      throw new Error(`Expected array response for ${endpoint}, page ${page}`);
    }
    entries.push(...pageEntries);
    if (pageEntries.length < 25) return entries;
  }
}

function normalizedParticipant(entry) {
  const login = String(entry?.user?.login ?? "").trim();
  const type = String(entry?.user?.type ?? "").toLowerCase();
  if (!login || type === "bot" || login.toLowerCase().endsWith("[bot]")) return null;
  return login;
}

function collaboratorPermission(collaborator) {
  if (collaborator?.permissions?.admin) return "admin";
  if (collaborator?.permissions?.maintain) return "maintain";
  if (collaborator?.permissions?.push) return "write";
  const role = String(collaborator?.role_name ?? "").toLowerCase();
  if (["admin", "maintain", "write"].includes(role)) return role;
  return "";
}

function currentMaintainers() {
  if (maintainerPermissionMap) return maintainerPermissionMap;
  maintainerPermissionMap = new Map();
  for (const collaborator of fetchPages(`repos/${repo}/collaborators?affiliation=all`)) {
    const login = String(collaborator?.login ?? "").trim();
    const permission = collaboratorPermission(collaborator);
    if (login && permission) {
      maintainerPermissionMap.set(login.toLowerCase(), { login, permission });
    }
  }
  return maintainerPermissionMap;
}

function maintainerInteractions(number, authorLogin) {
  const surfaces = [
    ["issue-comment", `repos/${repo}/issues/${number}/comments`],
    ["review", `repos/${repo}/pulls/${number}/reviews`],
    ["inline-comment", `repos/${repo}/pulls/${number}/comments`],
  ];
  const participants = new Map();
  const normalizedAuthor = String(authorLogin ?? "").toLowerCase();

  for (const [surface, endpoint] of surfaces) {
    for (const entry of fetchPages(endpoint)) {
      const login = normalizedParticipant(entry);
      if (!login || login.toLowerCase() === normalizedAuthor) continue;
      const current = participants.get(login.toLowerCase()) ?? {
        login,
        surfaces: new Set(),
      };
      current.surfaces.add(surface);
      participants.set(login.toLowerCase(), current);
    }
  }

  if (participants.size === 0) return [];
  const maintainers = currentMaintainers();
  return [...participants.values()]
    .filter((participant) => maintainers.has(participant.login.toLowerCase()))
    .map((participant) => {
      const maintainer = maintainers.get(participant.login.toLowerCase());
      return {
        login: maintainer.login,
        permission: maintainer.permission,
        surfaces: [...participant.surfaces].sort(),
      };
    })
    .sort((left, right) => left.login.localeCompare(right.login));
}

function hydrate(candidate) {
  const number = Number(candidate.number);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Invalid PR number: ${String(candidate.number)}`);
  }

  const live = runJson([
    "pr",
    "view",
    String(number),
    "--repo",
    repo,
    "--json",
    "number,state,isDraft,url,author,labels,statusCheckRollup,mergeStateStatus,headRefOid,additions,deletions,changedFiles",
  ]);

  if (String(live.state ?? "").toUpperCase() !== "OPEN") {
    return {
      ...candidate,
      number,
      state: live.state,
      url: live.url ?? candidate.url,
      headRefOid: live.headRefOid,
      hydrationComplete: false,
      hydrationSkipped: "not-open",
      hydrationError: `PR is ${String(live.state ?? "not open").toLowerCase()}`,
    };
  }

  let rest = runJson(["api", `repos/${repo}/pulls/${number}`]);

  const files = [];
  for (let page = 1; ; page += 1) {
    const pageFiles = runJson([
      "api",
      `repos/${repo}/pulls/${number}/files?per_page=25&page=${page}`,
    ]);
    if (!Array.isArray(pageFiles)) {
      throw new Error(`Expected file array for PR #${number}, page ${page}`);
    }
    files.push(
      ...pageFiles.map((file) => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
      })),
    );
    if (pageFiles.length < 25) break;
  }

  for (let attempt = 2; attempt <= 5 && unresolvedMergeability(rest); attempt += 1) {
    sleep(sleepMs);
    rest = runJson(["api", `repos/${repo}/pulls/${number}`]);
  }

  const priorMaintainerInteractions = maintainerInteractions(
    number,
    live.author?.login ?? rest.user?.login ?? candidate.author_login,
  );

  return {
    ...candidate,
    ...rest,
    number,
    state: live.state ?? rest.state,
    draft: live.isDraft ?? rest.draft,
    isDraft: live.isDraft ?? rest.draft,
    url: live.url ?? rest.html_url ?? candidate.url,
    author: live.author ?? candidate.author ?? rest.user,
    labels: live.labels ?? rest.labels ?? candidate.labels ?? [],
    additions: live.additions ?? rest.additions,
    deletions: live.deletions ?? rest.deletions,
    changed_files: rest.changed_files ?? live.changedFiles,
    changedFiles: live.changedFiles ?? rest.changed_files,
    mergeStateStatus: live.mergeStateStatus,
    headRefOid: live.headRefOid,
    statusCheckRollup: Array.isArray(live.statusCheckRollup)
      ? live.statusCheckRollup
      : [],
    maintainerParticipationChecked: true,
    maintainerInteractions: priorMaintainerInteractions,
    files,
  };
}

const parsed = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const candidates = candidateArray(parsed).slice(0, limit);
const hydrated = [];

for (const [index, candidate] of candidates.entries()) {
  process.stderr.write(`[${index + 1}/${candidates.length}] hydrate #${candidate.number}\n`);
  try {
    hydrated.push(hydrate(candidate));
  } catch (error) {
    if (!error?.transient && !error?.notFound) throw error;
    const reason = error?.notFound ? "stale or missing" : "unavailable after transient retries";
    process.stderr.write(
      `hydrate #${candidate.number} remained ${reason}; marking incomplete and continuing\n`,
    );
    hydrated.push({
      ...candidate,
      hydrationComplete: false,
      hydrationSkipped: error?.notFound ? "not-found" : undefined,
      hydrationError: error.message,
    });
  }
}

const output = `${JSON.stringify(hydrated, null, 2)}\n`;
if (outputPath) {
  fs.writeFileSync(outputPath, output);
} else {
  process.stdout.write(output);
}
