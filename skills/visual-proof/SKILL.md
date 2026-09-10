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
- Verify which build each browser actually serves; cached assets and service workers can invalidate an otherwise identical comparison.

## Capture Evidence

- Assert that the intended state is reached before capture; wait on observable UI or network conditions rather than fixed sleeps.
- Use paired screenshots for stable states. Use a short video when timing, animation, navigation, drag/drop, streaming, or multi-step interaction is material.
- Frame the changed surface with enough surrounding context to judge layout. Sanitize secrets and personal data without hiding the behavior under review.
- Keep working captures outside committed source unless the repository explicitly owns visual fixtures.

## Edit Interaction Recordings

Use three beats: **context → wait → result**. Establish the page and initiating action at normal speed, compress idle time, then hold the changed behavior long enough to inspect.

- Accelerate only idle waiting. Start with 4–8× when useful and show the multiplier throughout that interval, such as “Waiting for the response (6× speed).” Restore 1× before meaningful actions, transitions, or results. Keep latency measurements at real speed.
- Use a short, smoothly eased closeup on the actual changed element. Start around 1.5–2× with a 0.4–0.6-second ease; frame its label and nearby result as well as the detail. Measure the target in the captured viewport after layout settles, and reserve room for captions.
- Narrate visible behavior in one or two short caption lines. Align each caption with the action or result it describes, and hold the final evidence at normal speed for several seconds. Expand collapsed details through real UI controls when needed to make the result inspectable.
- Preserve the untouched raw recording, capture script, and timing cues alongside the edited output. Edits may shorten waiting and direct attention; they must preserve the real action/result sequence.

Prefer the repository's existing recording and rendering helpers. If it supplies a `proof-video` skill, read it before authoring cues; use its supported zoom, speed, and caption operations instead of building a parallel editor. For a helper that uses raw-video timestamps, keep all cues on that clock and let the renderer remap them after speed changes. Burn captions into the published video when the destination does not display subtitle tracks.

## Inspect Every Capture

Open every screenshot and watch every video. Confirm that the intended state, viewport, changed behavior, and relevant surrounding layout are visible. Re-capture clipped, stale, blank, misleading, or incorrectly seeded evidence.

For edited video, inspect the finalized output across its full timeline, then inspect full-size frames at speed boundaries, zoom transitions, caption changes, and the decisive result. Check that captions match the visible frame, the closeup keeps the relevant evidence readable and unobscured, and playback has returned to 1× for the result. Compare actual duration and frame rate with the intended edit; recording clocks and speed remapping can shift cues even when the script succeeds.

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
