import type { DirectoryFacets, Resource } from '../types/index';

export type ReviewState = 'current' | 'due-soon' | 'needs-review' | 'exception' | 'unknown';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getReviewState(resource: Resource, now = new Date()): ReviewState {
  if (!resource.review) return 'unknown';
  if (resource.review.status === 'exception') return 'exception';

  const dueAt = new Date(`${resource.review.reviewDueAt}T23:59:59Z`);
  if (Number.isNaN(dueAt.getTime())) return 'unknown';
  const daysUntilDue = (dueAt.getTime() - now.getTime()) / DAY_MS;
  if (daysUntilDue < 0) return 'needs-review';
  if (daysUntilDue <= 30) return 'due-soon';
  return 'current';
}

export function buildReviewQueue(resources: Resource[], now = new Date()): Resource[] {
  const priority: Record<ReviewState, number> = {
    exception: 0,
    'needs-review': 1,
    'due-soon': 2,
    unknown: 3,
    current: 4,
  };
  return [...resources]
    .filter((resource) => getReviewState(resource, now) !== 'current')
    .sort((a, b) => priority[getReviewState(a, now)] - priority[getReviewState(b, now)]);
}

export function getDirectoryFacets(resources: Resource[]): DirectoryFacets {
  const languageMap = new Map<string, string>();
  let hasWheelchairData = false;

  for (const resource of resources) {
    for (const language of resource.languages ?? []) {
      languageMap.set(language.code, language.label);
    }
    if (resource.accessibility?.wheelchair === 'yes' || resource.accessibility?.wheelchair === 'no') {
      hasWheelchairData = true;
    }
  }

  return {
    languages: [...languageMap.entries()]
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    hasWheelchairData,
  };
}
