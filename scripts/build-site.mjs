#!/usr/bin/env node

import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
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
const archiveTar = await createTar(skill);
const archiveGzip = gzipSync(archiveTar, { level: 9, mtime: 0 });
archiveGzip[9] = 3; // Normalize gzip's platform byte to Unix on every build host.
await writeFile(archivePath, archiveGzip);
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

async function createTar(directory) {
  const blocks = [];
  for (const file of await listFiles(directory)) {
    const name = `./${file}`;
    if (Buffer.byteLength(name) > 100) {
      throw new Error(`Archive path is too long for ustar: ${name}`);
    }
    const contents = await readFile(join(directory, file));
    const header = Buffer.alloc(512);
    writeString(header, name, 0, 100);
    writeOctal(header, 0o644, 100, 8);
    writeOctal(header, 0, 108, 8);
    writeOctal(header, 0, 116, 8);
    writeOctal(header, contents.length, 124, 12);
    writeOctal(header, 0, 136, 12);
    header.fill(0x20, 148, 156);
    header[156] = "0".charCodeAt(0);
    writeString(header, "ustar\0", 257, 6);
    writeString(header, "00", 263, 2);
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    writeString(header, `${checksum.toString(8).padStart(6, "0")}\0 `, 148, 8);
    blocks.push(header, contents, Buffer.alloc((512 - (contents.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

function writeString(buffer, value, offset, length) {
  buffer.write(value, offset, length, "ascii");
}

function writeOctal(buffer, value, offset, length) {
  writeString(buffer, `${value.toString(8).padStart(length - 1, "0")}\0`, offset, length);
}
