# ClawScan issue classification

## Manual finding remediation

Use this classification only when the reporter asks ClawHub maintainers to manually clear, override, suppress, or reclassify an individual ClawScan finding or verdict.

Propose closing with this exact comment, subject to Patrick's approval:

> Thanks for the detailed report. ClawHub does not manually override or clear individual ClawScan findings or verdicts. If the package changed, please publish a new version so the new artifact is scanned. If you believe the scanner's detection or evidence should change, contributions are welcome in the ClawScan repository. Closing this issue because there is no individual ClawHub finding action for us to take.

## Do not use the closure template for

- Stuck or never-completing scans.
- A scan attached to the wrong version or artifact.
- Stale or inconsistent ClawHub UI/API state.
- Publishing failures or queue failures.
- Account bans or moderation holds.
- Abuse reports or package ownership disputes.
- Reproducible ClawHub-to-ClawScan integration defects.

Those are operational, integration, publishing, or moderation issues and require their own review.
