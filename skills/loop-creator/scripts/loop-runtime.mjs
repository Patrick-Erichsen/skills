#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const digest = (data) => createHash("sha256").update(data).digest("hex");
const itemStatuses = new Set([
  "awaiting-signoff",
  "merged-with-approval",
  "merged-externally",
  "investigation",
  "decision",
  "blocked",
  "skipped",
  "closed",
  "reading",
  "local-review",
]);
const terminal = new Set(["completed", "failed", "blocked", "cancelled", "aborted"]);

function safeName(value) {
  assert(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(value), "Invalid identifier");
  return value;
}

function atomic(file, value) {
  const tmp = file + "." + randomUUID() + ".tmp";
  fs.writeFileSync(tmp, json(value), { mode: 0o600, flag: "wx" });
  fs.renameSync(tmp, file);
}

export function claim(root, resource, owner) {
  safeName(resource);
  safeName(owner);
  const dir = path.join(root, "claims", resource);
  fs.mkdirSync(path.dirname(dir), { recursive: true, mode: 0o700 });
  try {
    fs.mkdirSync(dir, { mode: 0o700 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const previous = fs.existsSync(path.join(dir, "owner.json"))
      ? read(path.join(dir, "owner.json"))
      : null;
    assert(
      previous?.owner === owner,
      `Resource busy: ${resource}; owner=${previous?.owner ?? "unknown; reconcile manually"}`,
    );
    return previous;
  }
  const receipt = { resource, owner, acquiredAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, "owner.json"), json(receipt), { mode: 0o600, flag: "wx" });
  return receipt;
}

export function release(root, resource, owner) {
  const dir = path.join(root, "claims", safeName(resource));
  const receipt = read(path.join(dir, "owner.json"));
  assert(receipt.owner === owner, "Only the recorded owner can release a claim");
  fs.unlinkSync(path.join(dir, "owner.json"));
  fs.rmdirSync(dir);
}

export function begin(root, loopId, sessionKey) {
  safeName(loopId);
  assert(sessionKey?.startsWith("agent:"), "A persistent session key is required");
  const runId = new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomUUID().slice(0, 8);
  claim(root, `loop-${loopId}`, runId);
  const runDir = path.resolve(root, "runs", loopId, runId);
  fs.mkdirSync(runDir, { recursive: true, mode: 0o700 });
  const latestPath = path.join(runDir, "..", "latest.json");
  const previousRunId = fs.existsSync(latestPath) ? read(latestPath).runId : null;
  const manifest = {
    version: 1,
    loopId,
    runId,
    sessionKey,
    startedAt: new Date().toISOString(),
    runDir,
    previousRunId,
  };
  fs.writeFileSync(path.join(runDir, "started.json"), json(manifest), { mode: 0o600, flag: "wx" });
  return manifest;
}

function httpsUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}

function evidenceFile(runDir, relative) {
  assert(
    typeof relative === "string" && !path.isAbsolute(relative),
    "Evidence paths must be relative",
  );
  const root = fs.realpathSync(runDir) + path.sep;
  const file = fs.realpathSync(path.resolve(runDir, relative));
  assert(
    file.startsWith(root) && fs.statSync(file).isFile(),
    "Evidence must be a file inside the run",
  );
  const data = fs.readFileSync(file);
  assert(data.length > 0, `Empty evidence: ${relative}`);
  return { path: relative, bytes: data.length, sha256: digest(data) };
}

export function validateResult(result) {
  safeName(result.loopId);
  safeName(result.runId);
  assert(["complete", "degraded", "failed"].includes(result.status), "Invalid run status");
  assert(
    Number.isFinite(Date.parse(result.startedAt)) &&
      Date.parse(result.finishedAt) >= Date.parse(result.startedAt),
    "Invalid run interval",
  );
  assert(
    typeof result.overview === "string" &&
      result.overview.length > 0 &&
      result.overview.length <= 3000,
    "Overview required, maximum 3000 characters",
  );
  assert(
    typeof result.ignored === "string" && result.ignored.length <= 3000,
    "Record what was omitted and why",
  );
  assert(
    Array.isArray(result.gaps) &&
      result.gaps.every((g) => typeof g === "string" && g.length <= 2000),
    "Invalid gaps",
  );
  assert(
    result.status !== "complete" || !result.gaps.length,
    "A complete run cannot have evidence gaps",
  );
  assert(
    Array.isArray(result.traces) &&
      (result.traces.length || (result.status !== "complete" && result.gaps.length)),
    "Trace evidence required, or an explicit non-complete gap",
  );
  assert(Array.isArray(result.workers), "Worker receipts required, even when empty");
  const workers = new Set();
  for (const worker of result.workers) {
    assert(
      worker.taskId && worker.sessionKey && worker.evidencePath && terminal.has(worker.status),
      "Worker is unfinished or lacks native evidence",
    );
    if (worker.status === "blocked")
      assert(
        typeof worker.reason === "string" && worker.reason.trim(),
        "Blocked workers need a concrete reason",
      );
    assert(!workers.has(worker.taskId), "Duplicate worker receipt");
    workers.add(worker.taskId);
    assert(
      result.status !== "complete" || worker.status === "completed",
      "Unsuccessful worker requires non-complete run status",
    );
  }
  assert(Array.isArray(result.items), "Items required");
  const ids = new Set();
  for (const item of result.items) {
    assert(item.id && !ids.has(item.id), "Duplicate or missing item ID");
    ids.add(item.id);
    assert(itemStatuses.has(item.status), "Invalid item status");
    assert(
      typeof item.summary === "string" && item.summary.length > 0 && item.summary.length <= 3000,
      "Item summary required, maximum 3000 characters",
    );
    assert(
      item.links && Object.keys(item.links).length && Object.values(item.links).every(httpsUrl),
      "Every item requires valid HTTPS links",
    );
    assert(Object.keys(item.links).length <= 12, "Too many item links");
    if (["awaiting-signoff", "merged-with-approval"].includes(item.status)) {
      assert(
        item.links.pr &&
          item.links.linear &&
          item.links.session &&
          /^[a-f0-9]{40}$/i.test(item.headSha),
        "PR outcome needs PR, Linear, Session and exact head",
      );
    }
    if (item.status === "merged-with-approval") {
      assert(
        httpsUrl(item.approvalUrl) && /^[a-f0-9]{40}$/i.test(item.mergeSha),
        "Loop landing needs explicit approval evidence and merge SHA",
      );
    }
  }
  return result;
}

export function verifyPullRequests(
  result,
  lookup = (url) =>
    JSON.parse(
      execFileSync(
        "gh",
        ["pr", "view", url, "--json", "state,isDraft,headRefOid,mergeCommit,url"],
        { encoding: "utf8", timeout: 120000 },
      ),
    ),
) {
  return result.items
    .filter((item) =>
      ["awaiting-signoff", "merged-with-approval", "merged-externally"].includes(item.status),
    )
    .map((item) => {
      assert(
        /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(item.links.pr),
        "A canonical GitHub PR URL is required",
      );
      const live = lookup(item.links.pr);
      if (item.status === "awaiting-signoff") {
        assert(
          live.state === "OPEN" && !live.isDraft && live.headRefOid === item.headSha,
          `PR is not ready at the recorded head: ${item.links.pr}`,
        );
      } else {
        assert(live.state === "MERGED", `PR is not merged: ${item.links.pr}`);
        if (item.status === "merged-with-approval")
          assert(live.mergeCommit?.oid === item.mergeSha, "Merge SHA mismatch");
      }
      return { itemId: item.id, checkedAt: new Date().toISOString(), ...live };
    });
}

export function seal(runDir, input) {
  const result = validateResult(read(input));
  reports(result);
  const started = read(path.join(runDir, "started.json"));
  assert(
    result.runId === started.runId &&
      result.loopId === started.loopId &&
      result.startedAt === started.startedAt,
    "Result must match its run manifest",
  );
  const evidence = [
    ...new Set([...result.traces, ...result.workers.map((w) => w.evidencePath)]),
  ].map((file) => evidenceFile(runDir, file));
  const pullRequests = verifyPullRequests(result);
  const sealed = {
    ...result,
    version: 1,
    sessionKey: started.sessionKey,
    evidence,
    pullRequests,
    sealedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(runDir, "result.json"), json(sealed), { mode: 0o600, flag: "wx" });
  atomic(path.join(runDir, "..", "latest.json"), {
    runId: result.runId,
    resultPath: path.resolve(runDir, "result.json"),
  });
  return sealed;
}

const labels = {
  pr: "PR",
  linear: "Linear",
  session: "Session",
  source: "Source",
  evidence: "Evidence",
};
const headings = {
  "awaiting-signoff": "Ready for your review",
  "merged-with-approval": "Landed after your approval",
  "merged-externally": "Merged elsewhere",
  investigation: "Worth investigating",
  decision: "Needs your decision",
  blocked: "Blocked",
  skipped: "Left out",
  closed: "Closed",
  reading: "Worth reading",
  "local-review": "Local work ready for review",
};

export function reports(result) {
  validateResult(result);
  const count = (status) => result.items.filter((i) => i.status === status).length;
  const overview = {
    blocks: [
      { type: "text", text: result.overview },
      {
        type: "text",
        title: "What we left out",
        text: result.ignored || "Nothing deliberately excluded.",
      },
      {
        type: "metrics",
        items: [
          { label: "Awaiting signoff", value: String(count("awaiting-signoff")) },
          { label: "Landed with approval", value: String(count("merged-with-approval")) },
          { label: "Merged elsewhere", value: String(count("merged-externally")) },
        ],
      },
      {
        type: "text",
        title: "Run",
        text: `${result.startedAt} to ${result.finishedAt}. Landing always requires human signoff.`,
      },
    ],
  };
  if (result.gaps.length) {
    assert(
      result.gaps.join("\n").length <= 4000,
      "Summarize coverage gaps; put details in evidence",
    );
    overview.blocks.push({ type: "text", title: "Coverage gaps", text: result.gaps.join("\n") });
  }
  assert(
    Buffer.byteLength(JSON.stringify(overview)) <= 8192,
    "Overview exceeds native report limit; shorten it",
  );
  const output = [
    { name: "loop-overview", title: `${result.loopId} | ${result.status}`, report: overview },
  ];
  let page = { blocks: [] };
  const flush = () => {
    if (page.blocks.length)
      output.push({
        name: `loop-items-${String(output.length).padStart(3, "0")}`,
        title: "Findings and outcomes",
        report: page,
      });
    page = { blocks: [] };
  };
  for (const item of result.items) {
    const order = (key) => ({ pr: 0, linear: 1, session: 2 })[key] ?? 3;
    const entries = Object.entries(item.links).sort(([a], [b]) => order(a) - order(b));
    const blocks = [
      { type: "text", title: headings[item.status], text: item.summary },
      {
        type: "links",
        items: entries.map(([label, url]) => ({ label: labels[label] ?? label, url })),
      },
    ];
    if (
      page.blocks.length + blocks.length > 24 ||
      Buffer.byteLength(JSON.stringify({ ...page, blocks: [...page.blocks, ...blocks] })) > 8192
    )
      flush();
    page.blocks.push(...blocks);
    assert(
      Buffer.byteLength(JSON.stringify(page)) <= 8192,
      "Single item exceeds native report limit",
    );
  }
  flush();
  return output;
}

function main([command, ...args]) {
  switch (command) {
    case "begin":
      return begin(...args);
    case "claim":
      return claim(...args);
    case "release":
      release(...args);
      return { released: true };
    case "seal":
      return seal(...args);
    case "render":
      return reports(read(args[0]));
    case "verify":
      return verifyPullRequests(validateResult(read(args[0])));
    default:
      return {
        usage: [
          "begin ROOT LOOP_ID SESSION_KEY",
          "claim ROOT RESOURCE RUN_ID",
          "release ROOT RESOURCE RUN_ID",
          "seal RUN_DIR INPUT_JSON",
          "render RESULT_JSON",
          "verify RESULT_JSON",
        ],
      };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    process.stdout.write(json(main(process.argv.slice(2))));
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
