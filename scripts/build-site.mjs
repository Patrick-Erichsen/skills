#!/usr/bin/env node

import { cp, mkdir, mkdtemp, readFile, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "site");
const skill = join(root, "skills", "viz-explain");
const output = join(root, ".site-dist");
const manifest = join(skill, "assets", "explainers.json");
const explainers = JSON.parse(await readFile(manifest, "utf8"));
const template = await readFile(join(source, "explainer.html"), "utf8");
const pedagogyMarkdown = await readFile(
  join(skill, "references", "visual-pedagogy.md"),
  "utf8",
);

if (explainers.length !== 10) {
  throw new Error(`Expected 10 explainers, found ${explainers.length}`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const name of ["index.html", "styles.css", "app.js"]) {
  await cp(join(source, name), join(output, name));
}
await cp(manifest, join(output, "explainers.json"));

await mkdir(join(output, "scenes"), { recursive: true });
const skillMarkdown = await readFile(join(skill, "SKILL.md"), "utf8");
for (const explainer of explainers) {
  const scene = join(skill, "assets", "scenes", `${explainer.slug}.excalidraw`);
  const reference = join(skill, "references", `${explainer.slug}.md`);
  const [sceneJson, referenceMarkdown] = await Promise.all([
    readFile(scene, "utf8"),
    readFile(reference, "utf8"),
  ]);
  if (!referenceMarkdown.startsWith(`# ${explainer.name}\n`)) {
    throw new Error(`${explainer.slug}: reference heading does not match manifest name`);
  }
  if (!referenceMarkdown.includes(`assets/scenes/${explainer.slug}.excalidraw`)) {
    throw new Error(`${explainer.slug}: reference does not link its canonical scene`);
  }
  if (!skillMarkdown.includes(`[${explainer.name}](references/${explainer.slug}.md)`)) {
    throw new Error(`${explainer.slug}: SKILL.md route does not match manifest metadata`);
  }
  if (!pedagogyMarkdown.includes(`**${Number(explainer.number)}. ${explainer.name}**`)) {
    throw new Error(`${explainer.slug}: pedagogy table does not match manifest metadata`);
  }
  const parsedScene = JSON.parse(sceneJson);
  if (parsedScene.type !== "excalidraw" || !parsedScene.elements?.length) {
    throw new Error(`${explainer.slug}: canonical scene is empty or invalid`);
  }
  await cp(scene, join(output, "scenes", `${explainer.slug}.excalidraw`));
  const route = join(output, "explainers", explainer.slug);
  await mkdir(route, { recursive: true });
  await writeFile(join(route, "index.html"), template.replaceAll("%%SLUG%%", explainer.slug));
}

const discoveryTarget = join(output, ".well-known", "agent-skills");
await mkdir(discoveryTarget, { recursive: true });
const archivePath = join(discoveryTarget, "viz-explain.tar.gz");
const archiveRoot = await mkdtemp(join(tmpdir(), "viz-explain-"));
await cp(skill, archiveRoot, { recursive: true });
const archivedFiles = await listFiles(archiveRoot);
await Promise.all(
  archivedFiles.map((file) => utimes(join(archiveRoot, file), new Date(0), new Date(0))),
);
const tarPath = archivePath.replace(/\.gz$/, "");
const tarVersion = spawnSync("tar", ["--version"], { encoding: "utf8" }).stdout;
const ownershipFlags = tarVersion.startsWith("bsdtar")
  ? ["--uid", "0", "--gid", "0", "--uname", "root", "--gname", "root"]
  : ["--owner=0", "--group=0", "--numeric-owner"];
const archived = spawnSync("tar", [
  "--format", "ustar",
  ...ownershipFlags,
  "-cf", tarPath,
  ...archivedFiles.map((file) => `./${file}`),
], {
  cwd: archiveRoot,
  encoding: "utf8",
  env: { ...process.env, COPYFILE_DISABLE: "1" },
});
if (archived.status !== 0) {
  throw new Error(`Could not archive viz-explain: ${archived.stderr}`);
}
const compressed = spawnSync("gzip", ["-n", "-9", tarPath], { encoding: "utf8" });
await rm(archiveRoot, { recursive: true, force: true });
if (compressed.status !== 0) {
  throw new Error(`Could not compress viz-explain: ${compressed.stderr}`);
}
const archiveBytes = await readFile(archivePath);
const digest = createHash("sha256").update(archiveBytes).digest("hex");
const description = skillMarkdown.match(/^description:\s*(.+)$/m)?.[1]?.trim();
if (!description) throw new Error("viz-explain SKILL.md has no description");
await writeFile(
  join(discoveryTarget, "index.json"),
  `${JSON.stringify(
    {
      $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
      skills: [
        {
          name: "viz-explain",
          type: "archive",
          description,
          url: "viz-explain.tar.gz",
          digest: `sha256:${digest}`,
        },
      ],
    },
    null,
    2,
  )}\n`,
);
await writeFile(join(output, ".nojekyll"), "");

console.log(`built ${explainers.length} explainers in ${output}`);

async function listFiles(directory, prefix = "") {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await listFiles(join(directory, entry.name), relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}
