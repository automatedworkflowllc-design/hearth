import { describe, it, expect } from 'vitest';
import { searchResources, getResourceById, calculateDistance } from '../../src/services/resourceService';
import type { Resource } from '../../src/types/index';

// Small, explicit fixture -- tests run against THIS data (injected via the dataset param),
// never the shipping mockResources, so assertions stay stable as real data changes.
const fixture: Resource[] = [
  {
    id: 'alpha', name: 'Alpha Food Pantry', category: 'food',
    description: 'Free groceries for families in need.',
    address: '1 Alpha St, Gainesville, FL',
    location: { city: 'Gainesville', state: 'FL', zipCode: '32601', lat: 29.6516, lng: -82.3248 },
    hours: 'Mon 9-5', tags: ['food', 'pantry'],
  },
  {
    id: 'beta', name: 'Beta Emergency Shelter', category: 'shelter',
    description: 'Overnight beds and meals.',
    address: '2 Beta Ave, Gainesville, FL',
    location: { city: 'Gainesville', state: 'FL', zipCode: '32609', lat: 29.7000, lng: -82.3000 },
    hours: '24/7', tags: ['shelter', 'beds'],
  },
  {
    id: 'gamma', name: 'Gamma Legal Aid', category: 'legal',
    description: 'Free civil legal help.',
    // No coordinates on purpose -- exercises the "missing coords sorts last" path.
    location: { city: 'Gainesville', state: 'FL', zipCode: '32601' },
    hours: 'Mon-Fri 9-5', tags: ['legal'],
  },
];

describe('searchResources', () => {
  it('returns all resources with no filters', () => {
    expect(searchResources('', 'all', 'all', [], undefined, 'relevance', fixture)).toHaveLength(3);
  });

  it('filters by category', () => {
    const r = searchResources('', 'food', 'all', [], undefined, 'relevance', fixture);
    expect(r.map((x) => x.id)).toEqual(['alpha']);
  });

  it('matches query against name, description, and tags', () => {
    expect(searchResources('shelter', 'all', 'all', [], undefined, 'relevance', fixture).map((x) => x.id)).toEqual(['beta']);
    expect(searchResources('groceries', 'all', 'all', [], undefined, 'relevance', fixture).map((x) => x.id)).toEqual(['alpha']);
    expect(searchResources('legal', 'all', 'all', [], undefined, 'relevance', fixture).map((x) => x.id)).toEqual(['gamma']);
  });

  it('returns empty for a non-matching query', () => {
    expect(searchResources('zzzznotareal', 'all', 'all', [], undefined, 'relevance', fixture)).toEqual([]);
  });

  it('filters by tag', () => {
    expect(searchResources('', 'all', 'all', ['pantry'], undefined, 'relevance', fixture).map((x) => x.id)).toEqual(['alpha']);
  });

  it('sorts by name A-Z', () => {
    const r = searchResources('', 'all', 'all', [], undefined, 'name', fixture);
    expect(r.map((x) => x.name)).toEqual(['Alpha Food Pantry', 'Beta Emergency Shelter', 'Gamma Legal Aid']);
  });

  it('does not mutate the source dataset', () => {
    const before = fixture.map((r) => r.id);
    searchResources('', 'all', 'all', [], { lat: 29.65, lng: -82.32 }, 'distance', fixture);
    expect(fixture.map((r) => r.id)).toEqual(before);
    expect(fixture.every((r) => r.distanceMiles === undefined)).toBe(true);
  });
});

describe('distance behavior (the audited 0,0 bug)', () => {
  it('annotates distanceMiles when a user location is given, and leaves coord-less resources undefined', () => {
    const r = searchResources('', 'all', 'all', [], { lat: 29.6516, lng: -82.3248 }, 'name', fixture);
    const alpha = r.find((x) => x.id === 'alpha')!;
    const gamma = r.find((x) => x.id === 'gamma')!;
    expect(alpha.distanceMiles).toBeCloseTo(0, 1); // same coords as the user
    expect(gamma.distanceMiles).toBeUndefined();   // no coords -> no fabricated distance
  });

  it('sorts coord-less resources LAST under distance sort (never to 0,0 / nearby)', () => {
    const r = searchResources('', 'all', 'all', [], { lat: 29.6516, lng: -82.3248 }, 'distance', fixture);
    expect(r[0].id).toBe('alpha');            // nearest
    expect(r[r.length - 1].id).toBe('gamma'); // coord-less -> last
  });
});

describe('calculateDistance (Haversine)', () => {
  it('is 0 for identical points', () => {
    expect(calculateDistance(29.65, -82.32, 29.65, -82.32)).toBe(0);
  });
  it('gives a sane positive distance across Gainesville (a few miles)', () => {
    const d = calculateDistance(29.6516, -82.3248, 29.7, -82.3);
    expect(d).toBeGreaterThan(2);
    expect(d).toBeLessThan(6);
  });
});

describe('getResourceById', () => {
  it('finds a resource by id and returns undefined for a miss', () => {
    expect(getResourceById('beta', fixture)?.name).toBe('Beta Emergency Shelter');
    expect(getResourceById('nope', fixture)).toBeUndefined();
    expect(getResourceById('', fixture)).toBeUndefined();
  });
});
