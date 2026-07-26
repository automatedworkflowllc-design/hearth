import { describe, expect, it } from 'vitest';
import { buildReviewQueue, getDirectoryFacets, getReviewState } from '../../src/services/dataQuality';
import type { Resource } from '../../src/types/index';

const base: Resource = {
  id: 'a',
  name: 'Alpha',
  category: 'health',
  description: 'Example',
  location: {},
  contacts: [],
  hours: 'Call',
  tags: [],
};

describe('resource review operations', () => {
  it('separates current, due, expired, and exception records', () => {
    const now = new Date('2026-07-25T12:00:00Z');
    expect(getReviewState({ ...base, review: {
      reviewedAt: '2026-07-01',
      reviewDueAt: '2026-12-01',
      sources: [],
    } }, now)).toBe('current');
    expect(getReviewState({ ...base, review: {
      reviewedAt: '2026-07-01',
      reviewDueAt: '2026-08-01',
      sources: [],
    } }, now)).toBe('due-soon');
    expect(getReviewState({ ...base, review: {
      reviewedAt: '2026-01-01',
      reviewDueAt: '2026-07-01',
      sources: [],
    } }, now)).toBe('needs-review');
    expect(getReviewState({ ...base, review: {
      reviewedAt: '2026-07-01',
      reviewDueAt: '2026-12-01',
      status: 'exception',
      sources: [],
    } }, now)).toBe('exception');
  });

  it('puts exceptions before expired records in the operator queue', () => {
    const now = new Date('2026-07-25T12:00:00Z');
    const expired = { ...base, id: 'expired', review: {
      reviewedAt: '2026-01-01', reviewDueAt: '2026-07-01', sources: [],
    } } satisfies Resource;
    const exception = { ...base, id: 'exception', review: {
      reviewedAt: '2026-07-01', reviewDueAt: '2026-12-01', status: 'exception' as const, sources: [],
    } } satisfies Resource;
    expect(buildReviewQueue([expired, exception], now).map((resource) => resource.id))
      .toEqual(['exception', 'expired']);
  });
});

describe('directory facets', () => {
  it('only exposes filters supported by real metadata', () => {
    const facets = getDirectoryFacets([
      {
        ...base,
        languages: [{ code: 'es', label: 'Spanish', access: 'service' }],
        accessibility: { wheelchair: 'yes' },
      },
      {
        ...base,
        id: 'b',
        languages: [{ code: 'es', label: 'Spanish', access: 'interpretation' }],
      },
    ]);
    expect(facets.languages).toEqual([{ code: 'es', label: 'Spanish' }]);
    expect(facets.hasWheelchairData).toBe(true);
  });
});
