---
name: visual-proof
description: Capture PR-ready visual proof for user-visible UI changes, including baseline/candidate comparisons, representative content states, responsive viewports, screenshots, and interaction video.
---

# Visual Proof

Produce evidence that lets a reviewer compare the real baseline and candidate without recreating the environment. Follow stricter repository or surface-specific proof rules when present.

## Build the Proof Matrix

Define the matrix before capturing. Include these states by default:

| State | What it proves |
| --- | --- |
| Loading | Progress UI preserves the intended layout and communicates activity. |
| Empty | Zero-data copy, spacing, and actions remain useful. |
| Typical | The primary user path works with representative data. |
| Content-heavy | Long labels, dense collections, wrapping, scrolling, and overflow remain usable. |

Add error, disabled, selected, expanded, paginated, permission-restricted, or interaction states when the change can affect them. A state may be omitted only when it cannot exist or is unrelated to the changed surface; record the reason with the proof.

Capture mobile (`390x844`) and desktop (`1440x900`) by default. Add tablet (`768x1024`), laptop (`1366x768`), or exact reported dimensions when the change crosses those breakpoints or reproduces there.

The matrix is complete when every required state has candidate coverage at every required viewport and every changed visual behavior has a direct before/after comparison.

## Hold the Comparison Constant

- Capture the baseline from the merge base, target branch, or last known-good release named in the task. Capture the candidate from the exact code proposed for review.
- Use separate worktrees, builds, or environments when necessary; preserve the active checkout and operator state.
- Keep route, fixture data, authentication, feature flags, theme, locale, browser family, viewport, and interaction sequence identical between baseline and candidate.
- Make fixtures deterministic. The content-heavy state should exercise realistic extremes such as long titles, long descriptions, many rows or cards, wrapping, pagination, and scrolling.
- Use the real running surface required by the repository. If repository policy permits a mock, label it clearly and assert the requests and fixture state it represents.

## Capture Evidence

- Assert that the intended state is reached before capture; wait on observable UI or network conditions rather than fixed sleeps.
- Use paired screenshots for stable states. Use a short video when timing, animation, navigation, drag/drop, streaming, or multi-step interaction is material.
- Frame the changed surface with enough surrounding context to judge layout. Sanitize secrets and personal data without hiding the behavior under review.
- Keep working captures outside committed source unless the repository explicitly owns visual fixtures.

## Inspect Every Capture

Open every screenshot and watch every video. Confirm that the intended state, viewport, changed behavior, and relevant surrounding layout are visible. Re-capture clipped, stale, blank, misleading, or incorrectly seeded evidence.

Capture is not proof until this inspection passes.

## Present the Proof

Publish stable states as paired evidence:

| State | Viewport | Before | After | Assertion |
| --- | --- | --- | --- | --- |
| Empty | `390x844` | image/link | image/link | Empty action remains visible without overflow. |

Alongside the table, report:

- Baseline and candidate refs.
- Exact route or flow.
- Whether the surface was live, isolated, or mocked.
- Commands or harness used.
- Videos for interactive behavior.
- Explicitly skipped matrix cells and why.

The proof is complete only when every published artifact has been inspected, every required matrix cell is present or explicitly justified, and the evidence corresponds to the exact candidate handed to the reviewer.
