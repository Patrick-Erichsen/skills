import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export type RevisionHistory = {
  versions: RevisionVersion[]
}

export type RevisionVersion = {
  id: string
  label: string
  timestamp?: string
  diff?: string
  changes?: RevisionChange[]
}

export type RevisionChange = {
  summary?: string
}

export function RevisionHistoryDialog({
  history,
  trigger,
}: {
  history: RevisionHistory
  trigger?: React.ReactNode
}) {
  const [selectedId, setSelectedId] = React.useState(history.versions[0]?.id)
  const selectedVersion =
    history.versions.find((version) => version.id === selectedId) ??
    history.versions[0]

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            View edits ({history.versions.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit history ({history.versions.length})</DialogTitle>
          <DialogDescription>
            Based on the chat transcript from the session where this document was
            written.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 overflow-hidden md:grid-cols-[16rem_1fr]">
          <nav className="space-y-2 overflow-auto" aria-label="Revision list">
            {history.versions.map((version, index) => (
              <button
                key={version.id}
                type="button"
                className="w-full rounded-md border px-3 py-2 text-left text-sm"
                data-selected={version.id === selectedVersion?.id ? "" : undefined}
                onClick={() => setSelectedId(version.id)}
              >
                <span className="block text-xs text-muted-foreground">
                  Edit {index + 1}
                </span>
                <span className="block font-medium">{version.label}</span>
                {version.timestamp ? (
                  <time className="block text-xs text-muted-foreground">
                    {formatTimestamp(version.timestamp)}
                  </time>
                ) : null}
              </button>
            ))}
          </nav>

          <section className="overflow-auto rounded-md border" aria-live="polite">
            {selectedVersion ? (
              <>
                <div className="border-b p-3">
                  <h3 className="font-medium">{selectedVersion.label}</h3>
                  {selectedVersion.changes?.length ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedVersion.changes
                        .map((change) => change.summary)
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
                <pre className="overflow-auto p-3 text-xs">
                  {selectedVersion.diff ?? "No diff available."}
                </pre>
              </>
            ) : (
              <p className="p-3 text-sm text-muted-foreground">
                No revisions available.
              </p>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return date.toLocaleString()
}
