#!/usr/bin/env tsx
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  buildRevisionHistory,
  readTranscriptEventsFromJsonl,
  stripPathPrefixFromRevisionHistory,
} from './src/index.ts'

type CliOptions = {
  transcript?: string
  transcriptLabel?: string
  document?: string
  output?: string
  documentAlias?: string[]
  stripPathPrefix?: string[]
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.transcript || !options.document) {
    throw new Error(
      'Usage: tsx scripts/agent-revision-history/cli.ts --transcript <session.jsonl> --document <file.md|file.mdx> [--output revision-history.json]',
    )
  }

  const transcriptPath = resolve(options.transcript)
  const documentPath = resolve(options.document)
  const outputPath = resolve(options.output ?? 'revision-history.json')
  const jsonl = await readFile(transcriptPath, 'utf8')
  const currentDocument = await readFile(documentPath, 'utf8')
  const events = await readTranscriptEventsFromJsonl(jsonl, { transcriptPath })
  let history = buildRevisionHistory({
    transcriptPath: options.transcriptLabel ?? transcriptPath,
    documentPath,
    events,
    currentDocument,
    documentAliases: options.documentAlias?.map((path) => resolve(path)),
  })
  for (const prefix of options.stripPathPrefix ?? []) {
    history = stripPathPrefixFromRevisionHistory(history, resolve(prefix))
  }

  await writeFile(outputPath, `${JSON.stringify(history, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${history.versions.length} revisions to ${outputPath}`)
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const next = args[i + 1]
    if (!arg?.startsWith('--')) continue
    if (!next || next.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`)
    }

    if (arg === '--transcript') options.transcript = next
    if (arg === '--transcript-label') options.transcriptLabel = next
    if (arg === '--document') options.document = next
    if (arg === '--output') options.output = next
    if (arg === '--document-alias') {
      options.documentAlias ??= []
      options.documentAlias.push(next)
    }
    if (arg === '--strip-path-prefix') {
      options.stripPathPrefix ??= []
      options.stripPathPrefix.push(next)
    }
    i++
  }
  return options
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
