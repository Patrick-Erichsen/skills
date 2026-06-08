import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('committed binary generates revision history without tsx', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'agent-revision-bin-'))
  const outputPath = join(outputDir, 'revision-history.json')

  await runNode([
    join(skillRoot, 'bin/agent-revision-history.mjs'),
    '--transcript',
    join(skillRoot, 'scripts/fixtures/session.jsonl'),
    '--document',
    join(skillRoot, 'scripts/fixtures/example.mdx'),
    '--document-alias',
    '/workspace/example.mdx',
    '--output',
    outputPath,
    '--strip-path-prefix',
    skillRoot,
  ])

  const history = JSON.parse(await readFile(outputPath, 'utf8'))
  assert.equal(history.versions.length, 2)
  assert.match(history.versions[0].diff, /title: New/)
})

function runNode(args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: skillRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolveRun()
        return
      }
      reject(new Error([`node exited with ${code}`, stdout, stderr].join('\n')))
    })
  })
}
