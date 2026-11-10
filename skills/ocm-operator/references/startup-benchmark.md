# Latest-Main Preview and Startup Benchmark

1. Inspect the requested repository before changing it:

   ```sh
   git status --short
   git branch --show-current
   git remote -v
   git worktree list
   git fetch origin main
   git rev-parse origin/main
   ```

   Preserve dirty work and existing branches. Use a separate worktree pinned
   to the fetched main SHA for an isolated test rather than resetting a
   user-owned checkout. Record the tested SHA and fetch time. Done when the
   runtime and the intended main revision are unambiguously matched.

2. Select the runtime shape. Use a source-backed preview for development, or
   build a package runtime for release/packaging claims. Preserve the full
   launcher, Node PATH, credential-loading setup, and existing service owner.
   Create a separate state root, workspace, port, and gateway token. Do not
   reuse the hosting Gateway's config or service. Done when isolation and
   build provenance are established.

3. Define timer boundaries before launch. Use a monotonic clock and report
   separate durations for whichever phases were actually measured:

   - Dependency installation and build.
   - Fresh environment/config preparation.
   - Launch request to an authenticated usable gateway.
   - Internal startup-to-ready duration, if emitted by the runtime.
   - User-facing UI/remote reachability verification.

   Label cold versus warm starts and prebuilt versus build-inclusive totals.
   Do not treat build time, OCM process creation, HTTP liveness, authenticated
   readiness, and rendered UI readiness as interchangeable measurements.

4. Start through the selected supervisor and wait with a bounded deadline for
   health and authenticated readiness. Record exit status and sanitized logs
   on failure. Verify the requesting client's route separately; a host-local
   fetch does not prove the user can reach the preview. Done when both the
   test gateway and the intended client path have evidence.

5. For a usable model test, follow
   [model-config-seeding.md](model-config-seeding.md). Keep pristine-onboarding
   benchmarks separate from seeded-model benchmarks. Done when the reported
   timings identify which configuration was used.

6. Report the exact tested SHA, runtime shape, timing boundaries, observed
   durations, reachable preview link, verification results, and retention
   policy. If a check was not measured, say so; do not estimate its duration.
   Recheck unrelated gateways after lifecycle changes. Leave user-requested
   test environments available until their agreed lifetime ends.
