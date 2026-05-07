---
name: frontend-work
description: "Use for frontend implementation, UI polish, responsive design, browser-based validation, screenshots, and PR-ready frontend changes."
---

# Frontend Work

Use this skill for frontend implementation or design work where the result should be visually checked, responsive, and ready to publish.

## Browser Workflow

1. Start from the user's screenshot, target URL, or current app state.
2. Run or reuse the app's local dev server when needed. Keep it running while the user is reviewing.
3. Choose the browser tool based on the environment:
   - In the Codex app, use the built-in browser for the initial implementation loop.
   - Outside the Codex app, use the user's configured browser tooling or MCPs, such as Chrome DevTools MCP, Playwright, or the repo's own visual test harness.
4. Inspect the actual page before editing. Use DOM state and screenshots to identify the real layout or interaction issue.
5. Make scoped frontend changes that preserve the app's existing design system, component patterns, and accessibility conventions.

## Responsive Validation

Verify meaningful viewport coverage before calling the work done:

- Mobile: about `390x844`.
- Tablet: about `768x1024`.
- Laptop: about `1366x768` or the user's screenshot-sized browser.
- Desktop: about `1440x900` or wider.

For each viewport, check:

- No text is clipped, awkwardly squeezed, or overlapping.
- Primary actions are visible and usable.
- Headers, sidebars, cards, dialogs, media, and toolbars keep stable dimensions.
- The layout does not create large accidental empty regions.
- Scrolling behavior is intentional.
- Any referenced image, icon, canvas, or generated visual asset renders correctly.

## Verification

Run the repo's standard checks when available and appropriate:

- Formatting.
- Linting.
- Typecheck.
- Unit or UI tests for affected behavior.
- Production build for route/layout changes.

If a command cannot run locally, record the reason clearly.

## PR Handoff

When the user asks to submit, open, or prepare a PR for frontend work:

- Include a short summary of the UI change.
- Include the commands run.
- Capture the relevant screenshots at PR time for the important states and viewport classes.
- For local-app work, prefer screenshots from the local instance (`localhost`, `127.0.0.1`, or the repo's documented dev URL) over hosted preview URLs. Use hosted preview screenshots only when the user asks for deployment verification or local verification is not possible.
- If the app needs a backend, start the local frontend with the repo's documented local/test backend configuration. For ClawHub-style detached worktrees, prefer the shared test/dev Convex URLs or the repo's worktree helper before trying a protected Vercel preview.
- Include screenshots directly in the PR description or a PR comment when possible.
- GitHub's normal issue/comment API can post Markdown but cannot upload local image attachments. Prefer an authenticated browser upload, a known screenshot upload helper, or the repo's established artifact path. If none is available, say so before using a temporary public file host, and include the local screenshot path as fallback evidence.
- If attachment upload fails after one reasonable recovery attempt, do not keep fighting the upload path silently. Post or report the local screenshot path and the exact URL/state that was verified, then ask whether the user wants a different hosting/attachment route.

## Final Review

Only open the verified URL in the user's real browser when they explicitly ask to see it there, usually:

```sh
open -a 'Google Chrome' '<url>'
```

If the real browser cannot connect, check whether the dev server is still running before diagnosing app code.

Do not open the real browser automatically at the end of every frontend turn.
