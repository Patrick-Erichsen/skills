#!/usr/bin/env node

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "site");
const skill = join(root, "skills", "viz-explain");
const output = join(root, ".site-dist");
const explainers = JSON.parse(await readFile(join(source, "explainers.json"), "utf8"));
const template = await readFile(join(source, "explainer.html"), "utf8");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const name of ["index.html", "styles.css", "app.js", "explainers.json"]) {
  await cp(join(source, name), join(output, name));
}

await mkdir(join(output, "scenes"), { recursive: true });
for (const explainer of explainers) {
  const scene = join(skill, "assets", "scenes", `${explainer.slug}.excalidraw`);
  const reference = join(skill, "references", `${explainer.slug}.md`);
  await Promise.all([readFile(scene), readFile(reference)]);
  await cp(scene, join(output, "scenes", `${explainer.slug}.excalidraw`));
  const route = join(output, "explainers", explainer.slug);
  await mkdir(route, { recursive: true });
  await writeFile(join(route, "index.html"), template.replaceAll("%%SLUG%%", explainer.slug));
}

const discoveryTarget = join(output, ".well-known", "agent-skills");
await mkdir(discoveryTarget, { recursive: true });
const archivePath = join(discoveryTarget, "viz-explain.tar.gz");
const archived = spawnSync("tar", ["-czf", archivePath, "."], {
  cwd: skill,
  encoding: "utf8",
});
if (archived.status !== 0) {
  throw new Error(`Could not archive viz-explain: ${archived.stderr}`);
}
const archiveBytes = await readFile(archivePath);
const digest = createHash("sha256").update(archiveBytes).digest("hex");
const skillMarkdown = await readFile(join(skill, "SKILL.md"), "utf8");
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
