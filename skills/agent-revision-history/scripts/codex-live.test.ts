import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { readTranscriptEventsFromJsonl } from './src/index.ts'

const shouldRun = process.env.RUN_AGENT_REVISION_CODEX_LIVE_TEST === '1'
const canaryModel = process.env.CODEX_LIVE_TEST_MODEL ?? 'gpt-5-mini'
const canaryTimeoutMs = Number(process.env.CODEX_LIVE_TEST_TIMEOUT_MS ?? 60_000)

test(
  'detects file edits emitted by the latest Codex CLI JSONL stream',
  {
    skip: shouldRun
      ? false
      : 'Set RUN_AGENT_REVISION_CODEX_LIVE_TEST=1 to run the live Codex CLI canary',
    timeout: canaryTimeoutMs + 10_000,
  },
  async (t) => {
    if (!process.env.OPENAI_API_KEY) {
      t.skip('OPENAI_API_KEY is required for the live Codex CLI canary')
      return
    }

    const workspace = await mkdtemp(join(tmpdir(), 'agent-revision-codex-live-'))
    const codexHome = join(workspace, '.codex')
    await mkdir(codexHome)
    const documentPath = join(workspace, 'sample.mdx')
    await writeFile(
      documentPath,
      [
        '---',
        'title: Draft',
        '---',
        '',
        'Intro paragraph.',
        '',
        'TODO: close this out.',
        '',
      ].join('\n'),
      'utf8',
    )

    const prompt = [
      'This is a parser compatibility canary.',
      'Edit ./sample.mdx using one apply_patch tool call.',
      'Change the frontmatter title to "Codex Live Test".',
      'Then say complete.',
    ].join('\n')

    const env = {
      ...process.env,
      CODEX_HOME: codexHome,
    }

    await runCodex(['--yes', '@openai/codex@latest', 'login', '--with-api-key'], {
      cwd: workspace,
      env,
      stdin: `${process.env.OPENAI_API_KEY}\n`,
      timeoutMs: 15_000,
    })

    const args = [
      '--yes',
      '@openai/codex@latest',
      'exec',
      '--json',
      '--skip-git-repo-check',
      '--ignore-user-config',
      '--dangerously-bypass-approvals-and-sandbox',
      '--model',
      canaryModel,
      '-C',
      workspace,
    ]
    args.push(prompt)

    const { stdout } = await runCodex(args, {
      cwd: workspace,
      env,
      timeoutMs: canaryTimeoutMs,
    })

    const currentDocument = await readFile(documentPath, 'utf8')
    const events = await readTranscriptEventsFromJsonl(stdout, {
      transcriptPath: 'codex-live-stdout.jsonl',
    })
    const editEvents = events.filter((event) => event.kind === 'file-edit')

    assert.ok(editEvents.length >= 1)
    assert.equal(editEvents.at(-1)?.path, documentPath)
    assert.equal(editEvents.at(-1)?.tool, 'codex-file-change')
    assert.match(currentDocument, /title:\s*"?Codex Live Test"?/)
  },
)

function runCodex(
  args: string[],
  {
    cwd,
    env,
    stdin,
    timeoutMs,
  }: {
    cwd: string
    env: NodeJS.ProcessEnv
    stdin?: string
    timeoutMs: number
  },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', args, {
      cwd,
      env,
      stdio: [stdin === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let timedOut = false

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    if (stdin !== undefined) {
      child.stdin?.end(stdin)
    }

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)

    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })

    child.on('close', (code, signal) => {
      clearTimeout(timeout)
      if (timedOut) {
        reject(
          new Error(
            `Codex live canary timed out after ${timeoutMs}ms using ${canaryModel}`,
          ),
        )
        return
      }
      if (code !== 0) {
        reject(
          new Error(
            [
              `Codex live canary exited with code ${code ?? 'null'} and signal ${signal ?? 'null'}`,
              redactSensitive(stderr.trim()),
              redactSensitive(stdout.trim()),
            ]
              .filter(Boolean)
              .join('\n\n'),
          ),
        )
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

function redactSensitive(value: string): string {
  const apiKey = process.env.OPENAI_API_KEY
  return apiKey ? value.replaceAll(apiKey, '<redacted>') : value
}
