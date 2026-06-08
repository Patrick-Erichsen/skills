import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRevisionHistory,
  readTranscriptEventsFromJsonl,
  stripPathPrefixFromRevisionHistory,
  type AgentEvent,
} from './src/index.ts'

const documentPath = '/repo/src/content/posts/example.mdx'

test('builds grouped revision history with snapshots and unified diffs', () => {
  const events: AgentEvent[] = [
    {
      id: 'u1',
      kind: 'user-message',
      timestamp: '2026-06-07T20:00:00.000Z',
      text: 'make the title more specific',
    },
    {
      id: 'a1',
      kind: 'assistant-message',
      timestamp: '2026-06-07T20:00:05.000Z',
      text: 'I will update the title.',
    },
    {
      id: 'e1',
      kind: 'file-edit',
      timestamp: '2026-06-07T20:00:10.000Z',
      path: documentPath,
      before: '---\ntitle: Old\n---\n\nHello.\n',
      after: '---\ntitle: New\n---\n\nHello.\n',
      tool: 'apply_patch',
      toolCallId: 'call-1',
    },
    {
      id: 'u2',
      kind: 'user-message',
      timestamp: '2026-06-07T20:01:00.000Z',
      text: 'add a note',
    },
    {
      id: 'e2',
      kind: 'file-edit',
      timestamp: '2026-06-07T20:01:10.000Z',
      path: documentPath,
      before: '---\ntitle: New\n---\n\nHello.\n',
      after: '---\ntitle: New\n---\n\nHello.\n\nNote.\n',
      tool: 'apply_patch',
      toolCallId: 'call-2',
    },
  ]

  const history = buildRevisionHistory({
    transcriptPath: '/tmp/session.jsonl',
    documentPath,
    events,
  })

  assert.equal(history.schemaVersion, 1)
  assert.equal(history.document.path, documentPath)
  assert.equal(history.versions.length, 2)
  assert.equal(history.versions[0].label, 'make the title more specific')
  assert.equal(history.versions[0].changes[0].summary, 'Updated title metadata')
  assert.equal(history.versions[0].snapshot, '---\ntitle: New\n---\n\nHello.\n')
  assert.match(history.versions[0].diff, /-title: Old/)
  assert.match(history.versions[0].diff, /\+title: New/)
  assert.equal(history.versions[1].label, 'add a note')
  assert.equal(history.versions[1].changes[0].summary, 'Edited a line')
  assert.equal(history.versions[1].snapshot, '---\ntitle: New\n---\n\nHello.\n\nNote.\n')
  assert.match(history.versions[1].diff, /\+Note\./)
  assert.deepEqual(history.versions[0].provenance, {
    transcriptPath: '/tmp/session.jsonl',
    eventIds: ['e1'],
    toolCallIds: ['call-1'],
    source: 'transcript',
  })
})

test('reads Codex-style apply_patch tool calls from JSONL', async () => {
  const jsonl = [
    JSON.stringify({
      id: 'msg-1',
      timestamp: '2026-06-07T20:00:00.000Z',
      role: 'user',
      content: 'change the post title',
    }),
    JSON.stringify({
      id: 'call-1',
      type: 'function_call',
      name: 'functions.apply_patch',
      arguments:
        '*** Begin Patch\\n*** Update File: /repo/src/content/posts/example.mdx\\n@@\\n-title: Old\\n+title: New\\n*** End Patch',
    }),
  ].join('\n')

  const events = await readTranscriptEventsFromJsonl(jsonl, {
    transcriptPath: '/tmp/codex.jsonl',
  })

  assert.equal(events.length, 2)
  assert.equal(events[0].kind, 'user-message')
  assert.equal(events[1].kind, 'file-edit')
  assert.equal(events[1].path, documentPath)
  assert.equal(events[1].tool, 'functions.apply_patch')
  assert.equal(events[1].patch?.includes('title: New'), true)
})

test('reads normalized file-edit events from JSONL', async () => {
  const jsonl = [
    JSON.stringify({
      id: 'msg-1',
      role: 'user',
      content: 'tighten intro',
    }),
    JSON.stringify({
      id: 'edit-1',
      kind: 'file-edit',
      path: documentPath,
      before: 'Old intro.',
      after: 'New intro.',
      tool: 'normalized-transcript',
      toolCallId: 'edit-1',
    }),
  ].join('\n')

  const events = await readTranscriptEventsFromJsonl(jsonl, {
    transcriptPath: '/tmp/normalized.jsonl',
  })

  assert.equal(events.length, 2)
  assert.equal(events[1].kind, 'file-edit')
  assert.equal(events[1].before, 'Old intro.')
  assert.equal(events[1].after, 'New intro.')
})

test('reads Codex rollout user messages and custom apply_patch calls', async () => {
  const jsonl = [
    JSON.stringify({
      timestamp: '2026-06-07T20:00:00.000Z',
      type: 'event_msg',
      payload: {
        type: 'user_message',
        message: 'revise the title',
      },
    }),
    JSON.stringify({
      timestamp: '2026-06-07T20:00:10.000Z',
      type: 'response_item',
      payload: {
        type: 'custom_tool_call',
        call_id: 'call-1',
        name: 'apply_patch',
        input:
          '*** Begin Patch\n*** Update File: /repo/src/content/posts/example.mdx\n@@\n-title: Old\n+title: New\n*** End Patch',
      },
    }),
  ].join('\n')

  const events = await readTranscriptEventsFromJsonl(jsonl, {
    transcriptPath: '/tmp/rollout.jsonl',
  })

  assert.equal(events.length, 2)
  assert.equal(events[0].kind, 'user-message')
  assert.equal(events[0].text, 'revise the title')
  assert.equal(events[1].kind, 'file-edit')
  assert.equal(events[1].tool, 'apply_patch')
  assert.equal(events[1].toolCallId, 'call-1')
})

test('reads current Codex JSONL file_change events', async () => {
  const jsonl = [
    JSON.stringify({
      type: 'item.completed',
      item: {
        id: 'item-1',
        type: 'file_change',
        status: 'completed',
        changes: [
          {
            path: documentPath,
            kind: 'update',
          },
        ],
      },
    }),
  ].join('\n')

  const events = await readTranscriptEventsFromJsonl(jsonl, {
    transcriptPath: '/tmp/current-codex.jsonl',
  })

  assert.equal(events.length, 1)
  assert.equal(events[0].kind, 'file-edit')
  assert.equal(events[0].path, documentPath)
  assert.equal(events[0].tool, 'codex-file-change')
  assert.equal(events[0].toolCallId, 'item-1')
})

test('reconstructs snapshots from final document and patch-only transcript events', () => {
  const events: AgentEvent[] = [
    {
      id: 'u1',
      kind: 'user-message',
      text: 'make the title more specific',
    },
    {
      id: 'e1',
      kind: 'file-edit',
      path: documentPath,
      patch:
        '*** Begin Patch\n*** Update File: /repo/src/content/posts/example.mdx\n@@\n-title: Old\n+title: New\n*** End Patch',
      toolCallId: 'call-1',
    },
    {
      id: 'u2',
      kind: 'user-message',
      text: 'add a note',
    },
    {
      id: 'e2',
      kind: 'file-edit',
      path: documentPath,
      patch:
        '*** Begin Patch\n*** Update File: /repo/src/content/posts/example.mdx\n@@\n Hello.\n+\n+Note.\n*** End Patch',
      toolCallId: 'call-2',
    },
  ]

  const history = buildRevisionHistory({
    transcriptPath: '/tmp/session.jsonl',
    documentPath,
    events,
    currentDocument: '---\ntitle: New\n---\n\nHello.\n\nNote.\n',
  })

  assert.equal(history.versions.length, 2)
  assert.equal(history.versions[0].snapshot, '---\ntitle: New\n---\n\nHello.\n')
  assert.equal(history.versions[1].snapshot, '---\ntitle: New\n---\n\nHello.\n\nNote.\n')
})

test('includes document aliases when filtering edits', () => {
  const oldPath = '/repo/src/content/posts/old-slug.mdx'
  const newPath = '/repo/src/content/posts/new-slug.mdx'
  const events: AgentEvent[] = [
    {
      id: 'u1',
      kind: 'user-message',
      text: 'rename the post',
    },
    {
      id: 'e1',
      kind: 'file-edit',
      path: oldPath,
      before: 'Old title',
      after: 'New title',
    },
  ]

  const history = buildRevisionHistory({
    transcriptPath: '/tmp/session.jsonl',
    documentPath: newPath,
    documentAliases: [oldPath],
    events,
  })

  assert.equal(history.versions.length, 1)
  assert.equal(history.versions[0].snapshot, 'New title')
})

test('strips local path prefixes from public revision history fields', () => {
  const history = buildRevisionHistory({
    transcriptPath: '/repo/.codex/sessions/session.jsonl',
    documentPath,
    events: [
      {
        id: 'u1',
        kind: 'user-message',
        text: 'make the title more specific',
      },
      {
        id: 'e1',
        kind: 'file-edit',
        path: documentPath,
        before: 'title: Old',
        after: 'title: New',
        patch:
          '*** Begin Patch\n*** Update File: /repo/src/content/posts/example.mdx\n@@\n-title: Old\n+title: New\n*** End Patch',
      },
    ],
  })

  const publicHistory = stripPathPrefixFromRevisionHistory(history, '/repo')
  const serialized = JSON.stringify(publicHistory)

  assert.equal(publicHistory.document.path, 'src/content/posts/example.mdx')
  assert.equal(publicHistory.versions[0].changes[0].path, 'src/content/posts/example.mdx')
  assert.match(publicHistory.versions[0].diff, /src\/content\/posts\/example\.mdx/)
  assert.doesNotMatch(serialized, /\/repo/)
})
