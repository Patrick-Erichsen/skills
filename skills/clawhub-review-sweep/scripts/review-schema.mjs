import { createHash } from 'node:crypto';

export const REVIEW_STATUSES = new Set(['complete', 'blocked']);
export const PRIORITIES = new Set(['p0', 'p1', 'p2', 'p3', 'p4']);
export const CONFIDENCE_LEVELS = new Set(['high', 'medium', 'low']);
export const ACTION_TYPES = new Set([
  'comment',
  'close',
  'review',
  'merge',
  'repair',
  'admin-command',
  'investigate',
  'none',
]);
export const ADMIN_CLASSIFICATIONS = new Set([
  'none',
  'exact-command',
  'partial-command',
  'unsupported',
]);
export const ADMIN_RECOMMENDATIONS = new Set([
  'approve',
  'deny',
  'needs-judgment',
  'not-applicable',
]);
export const CLAWSCAN_CLASSIFICATIONS = new Set([
  'not-related',
  'manual-finding-remediation',
  'scanner-operation',
  'integration-bug',
  'moderation-or-abuse',
]);
export const CLAWSCAN_CLOSURE_COMMENT =
  "Thanks for the detailed report. ClawHub does not manually override or clear individual ClawScan findings or verdicts. If the package changed, please publish a new version so the new artifact is scanned. If you believe the scanner's detection or evidence should change, contributions are welcome in the ClawScan repository. Closing this issue because there is no individual ClawHub finding action for us to take.";
export const VERDICTS = new Set([
  'actionable',
  'actionable-backlog',
  'actionable-linked-pr-blocked',
  'actionable-production-config',
  'actionable-security-ux',
  'admin-command-candidate',
  'awaiting-ci-and-exact-review',
  'canonical-policy-rfc',
  'changed-head-awaiting-exact-review',
  'close-publisher-owned-artifact',
  'conflicting-broad-needs-requalification',
  'conflicting-feed-series',
  'draft-artifact-pipeline-needs-proof',
  'draft-conflicting-broad',
  'draft-conflicting-feed-series',
  'draft-conflicting-needs-author',
  'draft-conflicting-needs-proof',
  'draft-conflicting-security-boundary',
  'draft-schema-automation-needs-proof',
  'draft-stale-product-branch',
  'duplicate',
  'external-control-plane-bug',
  'measured-no-go',
  'needs-author',
  'needs-contextual-trust-ux-decision',
  'needs-cross-project-security-contract',
  'needs-current-cli-verification',
  'needs-format-and-security-decision',
  'needs-identity-decision',
  'needs-identity-policy',
  'needs-moderation-policy-decision',
  'needs-official-review-policy',
  'needs-product-and-security-decision',
  'needs-product-and-trust-decision',
  'needs-product-decision',
  'needs-product-decision-and-repair',
  'needs-security-and-product-decision',
  'needs-security-and-runtime-contract',
  'needs-security-contract',
  'needs-security-policy',
  'needs-security-product-decision',
  'needs-vendor-and-security-evaluation',
  'prefer-versioned-claw',
  'ready-for-operator-approval',
  'ready-for-exact-head-rereview',
  'reject-until-upstream-safe',
  'repairable-but-unsafe-currently',
  'repairable-dependabot',
  'repairable-proof-gap',
  'repairable-request-changes',
  'request-changes',
  'request-changes-substantive',
  'umbrella-backlog',
]);

export function actionIsExternal(type) {
  return !['investigate', 'none'].includes(type);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function reviewRevision(review) {
  const material = { ...review };
  delete material.revision;
  delete material.reviewedAt;
  return `sha256:${createHash('sha256').update(JSON.stringify(stable(material))).digest('hex')}`;
}

function isStringOrNull(value) {
  return value === null || typeof value === 'string';
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}

function isNonEmptyStringArray(value) {
  return isStringArray(value) && value.length > 0;
}

export function reviewProblems(review, fingerprint) {
  const problems = [];
  if (!REVIEW_STATUSES.has(review?.status)) problems.push('invalid review status');
  if (!PRIORITIES.has(review?.priority)) problems.push('invalid priority');
  if (!VERDICTS.has(review?.verdict)) problems.push('invalid verdict');
  if (!CONFIDENCE_LEVELS.has(review?.confidence)) problems.push('invalid confidence');
  if (typeof review?.summary !== 'string' || review.summary.length === 0) {
    problems.push('summary is required');
  }
  if (!isNonEmptyStringArray(review?.evidence)) problems.push('evidence must contain specific strings');
  if (review?.revision !== reviewRevision(review)) problems.push('review revision is missing or stale');
  if (review?.status === 'blocked') {
    if (typeof review.blockedReason !== 'string' || review.blockedReason.length === 0) {
      problems.push('blockedReason is required for blocked reviews');
    }
  } else if (review?.blockedReason !== undefined && review.blockedReason !== null) {
    problems.push('blockedReason must be null for complete reviews');
  }

  if (!Array.isArray(review?.proposedActions)) {
    problems.push('proposedActions must be an array');
  } else {
    for (const [index, action] of review.proposedActions.entries()) {
      if (!ACTION_TYPES.has(action?.type)) problems.push(`action ${index} has invalid type`);
      if (typeof action?.summary !== 'string' || action.summary.length === 0) {
        problems.push(`action ${index} requires a summary`);
      }
      if (action?.targetFingerprint !== fingerprint) {
        problems.push(`action ${index} targets a stale fingerprint`);
      }
      if (action?.public !== actionIsExternal(action?.type)) {
        problems.push(`action ${index} has inconsistent external-action classification`);
      }
      if (action?.approvalStatus !== 'awaiting-patrick-review') {
        problems.push(`action ${index} is not awaiting Patrick review`);
      }
    }
  }

  const admin = review?.adminCapability;
  if (!ADMIN_CLASSIFICATIONS.has(admin?.classification)) {
    problems.push('invalid admin classification');
  }
  if (!ADMIN_RECOMMENDATIONS.has(admin?.recommendation)) {
    problems.push('invalid admin recommendation');
  }
  for (const field of ['commandFamily', 'readCommand', 'mutationTemplate']) {
    if (!isStringOrNull(admin?.[field])) problems.push(`admin ${field} must be string or null`);
  }
  if (!isStringArray(admin?.requiredEvidence)) {
    problems.push('admin requiredEvidence must be a string array');
  }
  if (admin?.classification === 'exact-command') {
    if (typeof admin.commandFamily !== 'string' || admin.commandFamily.length === 0) {
      problems.push('exact admin command requires commandFamily');
    }
    if (typeof admin.mutationTemplate !== 'string' || admin.mutationTemplate.length === 0) {
      problems.push('exact admin command requires mutationTemplate');
    }
    if (!isNonEmptyStringArray(admin.requiredEvidence)) {
      problems.push('exact admin command requires evidence');
    }
    if (!['approve', 'deny', 'needs-judgment'].includes(admin.recommendation)) {
      problems.push('exact admin command requires an actionable recommendation');
    }
  }
  if (admin?.classification === 'none') {
    if (
      admin.commandFamily !== null ||
      admin.readCommand !== null ||
      admin.mutationTemplate !== null ||
      (admin.requiredEvidence?.length ?? -1) !== 0 ||
      admin.recommendation !== 'not-applicable'
    ) {
      problems.push('non-admin review must use the empty admin capability shape');
    }
  }
  if (
    review?.proposedActions?.some((action) => action?.type === 'admin-command') &&
    admin?.classification !== 'exact-command'
  ) {
    problems.push('admin-command action requires an exact admin capability');
  }

  const clawscan = review?.clawscan;
  if (!CLAWSCAN_CLASSIFICATIONS.has(clawscan?.classification)) {
    problems.push('invalid ClawScan classification');
  }
  if (!isStringOrNull(clawscan?.closureComment)) {
    problems.push('ClawScan closureComment must be string or null');
  }
  if (clawscan?.classification === 'manual-finding-remediation') {
    if (clawscan.closureComment !== CLAWSCAN_CLOSURE_COMMENT) {
      problems.push('manual ClawScan remediation requires the exact approved closure comment');
    }
  } else if (clawscan?.closureComment !== null) {
    problems.push('non-remediation ClawScan classifications require a null closureComment');
  }
  return problems;
}
