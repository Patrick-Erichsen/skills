import { chmod, mkdir, readFile } from 'node:fs/promises'

import { build } from 'esbuild'

const skillRoot = new URL('../', import.meta.url)
const outdir = new URL('bin/', skillRoot)
const outfile = new URL('agent-revision-history.mjs', outdir)
const lockfile = JSON.parse(
  await readFile(new URL('package-lock.json', skillRoot), 'utf8'),
)
const diffVersion =
  lockfile.packages?.['node_modules/diff']?.version ?? 'unknown'

await mkdir(outdir, { recursive: true })
await build({
  entryPoints: [new URL('scripts/cli.ts', skillRoot).pathname],
  outfile: outfile.pathname,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  banner: {
    js: [
      '#!/usr/bin/env node',
      `/* Generated from scripts/cli.ts. Bundles diff@${diffVersion}. */`,
      '/* Maintainers: run npm install && npm run build in this skill directory. */',
    ].join('\n'),
  },
})
await chmod(outfile, 0o755)
