import { createTwoFilesPatch } from 'diff'

export type AgentEvent =
  | {
      id: string
      kind: 'user-message' | 'assistant-message'
      timestamp?: string
      text: string
    }
  | {
      id: string
      kind: 'file-edit'
      timestamp?: string
      path: string
      before?: string
      after?: string
      patch?: string
      tool?: string
      toolCallId?: string
    }

export type RevisionHistory = {
  schemaVersion: 1
  generatedAt: string
  transcript: {
    path: string
    adapter: string
  }
  document: {
    path: string
    kind: 'markdown' | 'mdx'
  }
  versions: RevisionVersion[]
}

export type RevisionVersion = {
  id: string
  label: string
  timestamp?: string
  snapshot: string
  diff: string
  changes: RevisionChange[]
  provenance: {
    source: 'transcript'
    transcriptPath: string
    eventIds: string[]
    toolCallIds: string[]
  }
}

export type RevisionChange = {
  id: string
  path: string
  tool?: string
  summary: string
  patch?: string
}

export type BuildRevisionHistoryOptions = {
  transcriptPath: string
  documentPath: string
  events: AgentEvent[]
  adapter?: string
  generatedAt?: string
  currentDocument?: string
  documentAliases?: string[]
}

export type ReadTranscriptOptions = {
  transcriptPath: string
}

type PatchDirection = 'forward' | 'reverse'

type ParsedHunk = {
  oldLines: string[]
  newLines: string[]
}

type ChangedLine = {
  kind: 'added' | 'removed'
  raw: string
}

export async function readTranscriptEventsFromJsonl(
  jsonl: string,
  _options: ReadTranscriptOptions,
): Promise<AgentEvent[]> {
  const events: AgentEvent[] = []

  for (const line of jsonl.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let record: unknown
    try {
      record = JSON.parse(trimmed)
    } catch {
      continue
    }

    const event = eventFromRecord(record, events.length)
    if (event) events.push(event)
  }

  return events
}

export function buildRevisionHistory({
  transcriptPath,
  documentPath,
  events,
  adapter = 'jsonl',
  generatedAt = new Date().toISOString(),
  currentDocument,
  documentAliases = [],
}: BuildRevisionHistoryOptions): RevisionHistory {
  assertSupportedDocument(documentPath)

  const fileEvents = events.filter(
    (event): event is Extract<AgentEvent, { kind: 'file-edit' }> =>
      event.kind === 'file-edit' &&
      [documentPath, ...documentAliases].some((path) =>
        isSameDocumentPath(event.path, path),
      ),
  )
  const versions: RevisionVersion[] = []

  let previousSnapshot = initialSnapshotFor(fileEvents, currentDocument)
  for (const fileEvent of fileEvents) {
    const previousUserMessage = findPreviousUserMessage(events, fileEvent.id)
    const nextSnapshot =
      fileEvent.after ??
      applyPatch(previousSnapshot, fileEvent.patch, 'forward') ??
      previousSnapshot

    versions.push({
      id: `version-${versions.length + 1}`,
      label: previousUserMessage?.text
        ? summarizeLabel(previousUserMessage.text)
        : `Edit ${versions.length + 1}`,
      timestamp: fileEvent.timestamp,
      snapshot: nextSnapshot,
      diff: createTwoFilesPatch(
        documentPath,
        documentPath,
        previousSnapshot,
        nextSnapshot,
        versions.at(-1)?.timestamp ?? '',
        fileEvent.timestamp ?? '',
      ),
      changes: [
        {
          id: fileEvent.id,
          path: fileEvent.path,
          tool: fileEvent.tool,
          summary: summarizeChange(previousSnapshot, nextSnapshot),
          patch: fileEvent.patch,
        },
      ],
      provenance: {
        source: 'transcript',
        transcriptPath,
        eventIds: [fileEvent.id],
        toolCallIds: fileEvent.toolCallId ? [fileEvent.toolCallId] : [],
      },
    })

    previousSnapshot = nextSnapshot
  }

  return {
    schemaVersion: 1,
    generatedAt,
    transcript: {
      path: transcriptPath,
      adapter,
    },
    document: {
      path: documentPath,
      kind: documentPath.endsWith('.mdx') ? 'mdx' : 'markdown',
    },
    versions,
  }
}

export function stripPathPrefixFromRevisionHistory(
  history: RevisionHistory,
  prefix: string,
): RevisionHistory {
  const normalizedPrefix = normalizePath(prefix).replace(/\/?$/, '/')
  return {
    ...history,
    transcript: {
      ...history.transcript,
      path: stripPathPrefix(history.transcript.path, normalizedPrefix),
    },
    document: {
      ...history.document,
      path: stripPathPrefix(history.document.path, normalizedPrefix),
    },
    versions: history.versions.map((version) => ({
      ...version,
      diff: stripPathPrefix(version.diff, normalizedPrefix),
      changes: version.changes.map((change) => ({
        ...change,
        path: stripPathPrefix(change.path, normalizedPrefix),
        patch: change.patch ? stripPathPrefix(change.patch, normalizedPrefix) : undefined,
      })),
      provenance: {
        ...version.provenance,
        transcriptPath: stripPathPrefix(
          version.provenance.transcriptPath,
          normalizedPrefix,
        ),
      },
    })),
  }
}

function initialSnapshotFor(
  fileEvents: Extract<AgentEvent, { kind: 'file-edit' }>[],
  currentDocument: string | undefined,
): string {
  if (currentDocument === undefined) return fileEvents[0]?.before ?? ''

  let snapshot = currentDocument
  for (const fileEvent of fileEvents.slice().reverse()) {
    snapshot =
      fileEvent.before ?? applyPatch(snapshot, fileEvent.patch, 'reverse') ?? snapshot
  }
  return snapshot
}

function eventFromRecord(record: unknown, index: number): AgentEvent | undefined {
  if (!isObject(record)) return undefined

  const rolloutEvent = eventFromRolloutRecord(record, index)
  if (rolloutEvent) return rolloutEvent

  const id = stringValue(record.id) ?? stringValue(record.item_id) ?? `event-${index + 1}`
  const timestamp = stringValue(record.timestamp) ?? stringValue(record.created_at)
  const kind = stringValue(record.kind)
  const path = stringValue(record.path)

  if (kind === 'file-edit' && path) {
    return {
      id,
      kind: 'file-edit',
      timestamp,
      path,
      before: stringValue(record.before),
      after: stringValue(record.after),
      patch: stringValue(record.patch),
      tool: stringValue(record.tool),
      toolCallId: stringValue(record.toolCallId),
    }
  }

  const role = stringValue(record.role)
  const content = textFromContent(record.content)

  if (role === 'user' && content) {
    return { id, kind: 'user-message', timestamp, text: content }
  }
  if (role === 'assistant' && content) {
    return { id, kind: 'assistant-message', timestamp, text: content }
  }

  const name = stringValue(record.name) ?? stringValue(record.tool_name)
  const type = stringValue(record.type)
  const args = stringValue(record.arguments) ?? stringValue(record.input)
  if ((type === 'function_call' || type === 'tool_call') && name && args) {
    const patch = extractPatch(args)
    if (patch) {
      const path = extractFirstPatchPath(patch)
      if (!path) return undefined
      return {
        id,
        kind: 'file-edit',
        timestamp,
        path,
        patch,
        tool: name,
        toolCallId: id,
      }
    }
  }

  return undefined
}

function eventFromRolloutRecord(
  record: Record<string, unknown>,
  index: number,
): AgentEvent | undefined {
  const timestamp = stringValue(record.timestamp)
  const type = stringValue(record.type)
  const item = record.item
  if ((type === 'item.completed' || type === 'item.started') && isObject(item)) {
    const itemType = stringValue(item.type)
    const status = stringValue(item.status)
    if (itemType === 'file_change' && status !== 'in_progress') {
      const change = Array.isArray(item.changes)
        ? item.changes.find(
            (candidate) => isObject(candidate) && stringValue(candidate.path),
          )
        : undefined
      if (!isObject(change)) return undefined

      const itemId = stringValue(item.id) ?? `event-${index + 1}`
      return {
        id: itemId,
        kind: 'file-edit',
        timestamp,
        path: stringValue(change.path) ?? '',
        tool: 'codex-file-change',
        toolCallId: itemId,
      }
    }
  }

  const payload = record.payload
  if (!isObject(payload)) return undefined

  const payloadType = stringValue(payload.type)
  if (type === 'event_msg' && payloadType === 'user_message') {
    const message = stringValue(payload.message)
    if (!message) return undefined
    return {
      id: `event-${index + 1}`,
      kind: 'user-message',
      timestamp,
      text: message,
    }
  }

  if (type === 'response_item' && payloadType === 'message') {
    const role = stringValue(payload.role)
    const content = textFromContent(payload.content)
    if (role !== 'assistant' || !content) return undefined
    return {
      id: `event-${index + 1}`,
      kind: 'assistant-message',
      timestamp,
      text: content,
    }
  }

  if (type === 'response_item' && payloadType === 'custom_tool_call') {
    const name = stringValue(payload.name)
    const input = stringValue(payload.input)
    const callId = stringValue(payload.call_id)
    if (!name || !input) return undefined
    const patch = extractPatch(input)
    if (!patch) return undefined
    const path = extractFirstPatchPath(patch)
    if (!path) return undefined
    return {
      id: callId ?? `event-${index + 1}`,
      kind: 'file-edit',
      timestamp,
      path,
      patch,
      tool: name,
      toolCallId: callId,
    }
  }

  return undefined
}

function findPreviousUserMessage(
  events: AgentEvent[],
  eventId: string,
): Extract<AgentEvent, { kind: 'user-message' }> | undefined {
  const index = events.findIndex((event) => event.id === eventId)
  for (let i = index - 1; i >= 0; i--) {
    const event = events[i]
    if (event?.kind === 'user-message') return event
  }
  return undefined
}

function applyPatch(
  content: string,
  patch: string | undefined,
  direction: PatchDirection,
): string | undefined {
  if (!patch) return undefined

  let nextContent = content
  const hunks = parsePatchHunks(patch)
  if (hunks.length === 0) return undefined

  for (const hunk of hunks) {
    const fromLines = direction === 'forward' ? hunk.oldLines : hunk.newLines
    const toLines = direction === 'forward' ? hunk.newLines : hunk.oldLines
    const replaced = replaceBlock(nextContent, fromLines.join('\n'), toLines.join('\n'))
    if (replaced === undefined) return undefined
    nextContent = replaced
  }

  return nextContent
}

function parsePatchHunks(patch: string): ParsedHunk[] {
  const hunks: ParsedHunk[] = []
  let current: ParsedHunk | undefined

  for (const line of patch.split('\n')) {
    if (line.startsWith('@@')) {
      current = { oldLines: [], newLines: [] }
      hunks.push(current)
      continue
    }
    if (!current || line.startsWith('***') || line.startsWith('\\ No newline')) continue

    if (line.startsWith(' ')) {
      current.oldLines.push(line.slice(1))
      current.newLines.push(line.slice(1))
    } else if (line.startsWith('-')) {
      current.oldLines.push(line.slice(1))
    } else if (line.startsWith('+')) {
      current.newLines.push(line.slice(1))
    }
  }

  return hunks
}

function replaceBlock(
  content: string,
  fromBlock: string,
  toBlock: string,
): string | undefined {
  if (!fromBlock) {
    return `${content}${content.endsWith('\n') ? '' : '\n'}${toBlock}${toBlock.endsWith('\n') ? '' : '\n'}`
  }

  const index = content.indexOf(fromBlock)
  if (index !== -1) {
    return `${content.slice(0, index)}${toBlock}${content.slice(index + fromBlock.length)}`
  }

  const withTrailingNewline = `${fromBlock}\n`
  const newlineIndex = content.indexOf(withTrailingNewline)
  if (newlineIndex === -1) return undefined
  return `${content.slice(0, newlineIndex)}${toBlock}\n${content.slice(newlineIndex + withTrailingNewline.length)}`
}

function extractPatch(value: string): string | undefined {
  const normalized =
    value.includes('\\n') && !value.includes('\n') ? value.replaceAll('\\n', '\n') : value
  const begin = normalized.indexOf('*** Begin Patch')
  const end = normalized.indexOf('*** End Patch')
  if (begin === -1 || end === -1) return undefined
  return normalized.slice(begin, end + '*** End Patch'.length)
}

function extractFirstPatchPath(patch: string): string | undefined {
  for (const line of patch.split('\n')) {
    const match = line.match(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/)
    if (match?.[1]) return match[1].trim()
  }
  return undefined
}

function summarizeLabel(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, 80)
}

function summarizeChange(before: string, after: string): string {
  if (!before && after) return 'Created document snapshot'
  if (before && !after) return 'Removed document content'
  return summarizeChangedLines(
    getChangedLines(createTwoFilesPatch('before', 'after', before, after, '', '')),
  )
}

function getChangedLines(diff: string): ChangedLine[] {
  return diff
    .split('\n')
    .filter((line) => {
      if (line.startsWith('+++') || line.startsWith('---')) return false
      return line.startsWith('+') || line.startsWith('-')
    })
    .map((line) => ({
      kind: line.startsWith('+') ? 'added' : 'removed',
      raw: line.replace(/^[+-]/, ''),
    }))
}

function summarizeChangedLines(changedLines: ChangedLine[]): string {
  const raw = changedLines.map((line) => line.raw).join('\n')
  const addedLines = changedLines.filter(
    (line) => line.kind === 'added' && line.raw.trim(),
  )

  if (!raw.trim()) return 'Updated document content'
  if (/^title:\s/m.test(raw)) return 'Updated title metadata'
  if (/^(description|published|tags|author|revisionHistory):\s/m.test(raw)) {
    return 'Updated post metadata'
  }
  if (/^import\s/m.test(raw)) return 'Updated media import'
  if (/<img\b/.test(raw) || /\bsrc=/.test(raw)) return 'Updated image'
  if (/<figcaption\b/.test(raw) || /<\/figcaption>/.test(raw)) {
    return 'Updated image caption'
  }
  if (/^#{1,6}\s/m.test(raw)) return 'Updated section heading'
  if (/:::\w*/.test(raw)) return 'Updated callout'
  if (/^\s*[-*]\s+/m.test(raw)) return 'Updated list item'
  if (addedLines.length === 0) return 'Removed text'
  if (addedLines.length === 1 && addedLines[0].raw.trim().length < 120) {
    return 'Edited a line'
  }
  return 'Updated paragraph text'
}

function assertSupportedDocument(path: string) {
  if (!path.endsWith('.md') && !path.endsWith('.mdx')) {
    throw new Error(`Only Markdown and MDX documents are supported for now: ${path}`)
  }
}

function isSameDocumentPath(eventPath: string, documentPath: string): boolean {
  const normalizedEventPath = normalizePath(eventPath)
  const normalizedDocumentPath = normalizePath(documentPath)
  return (
    normalizedEventPath === normalizedDocumentPath ||
    normalizedDocumentPath.endsWith(normalizedEventPath)
  )
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function stripPathPrefix(value: string, normalizedPrefix: string): string {
  return normalizePath(value).replaceAll(normalizedPrefix, '')
}

function textFromContent(content: unknown): string | undefined {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return undefined
  return content
    .map((item) => {
      if (typeof item === 'string') return item
      if (isObject(item)) return stringValue(item.text)
      return undefined
    })
    .filter(Boolean)
    .join('\n')
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
