import { describe, expect, it } from 'vitest';
import {
  buildResourceQuery,
  parseSearchOptions,
  rowToResource,
} from '../../worker/src/index';

describe('national directory worker', () => {
  it('bounds public search inputs and produces a safe parameterized query', () => {
    const options = parseSearchOptions(
      new URL(
        'https://directory.example/v1/resources/search?q=health&category=health&zip=32601&limit=999'
      )
    );
    const query = buildResourceQuery(options, {
      latitude: 29.6516,
      longitude: -82.3248,
    });

    expect(options.limit).toBe(100);
    expect(options.zip).toBe('32601');
    expect(query.sql).toContain('search_text LIKE ?');
    expect(query.sql).not.toContain('health');
    expect(query.pageBindings).toContain('%health%');
    expect(query.pageBindings.at(-2)).toBe(100);
  });

  it('rejects malformed coordinates and cursors', () => {
    expect(() =>
      parseSearchOptions(new URL('https://directory.example/v1/resources/search?lat=29'))
    ).toThrow(/together/i);
    expect(() =>
      parseSearchOptions(new URL('https://directory.example/v1/resources/search?cursor=not-base64'))
    ).toThrow(/cursor/i);
  });

  it('maps an imported HRSA row into the browser resource contract', () => {
    const resource = rowToResource(
      {
        id: 'hrsa:H80CS00305:1',
        source_name: 'HRSA',
        source_url: 'https://data.hrsa.gov/topics/health-centers',
        source_updated_at: '2026-07-26T00:00:00.000Z',
        fetched_at: '2026-07-26T00:00:00.000Z',
        name: 'Example Health Center',
        category: 'health',
        description: 'An active HRSA health-center site.',
        address: '100 Main St',
        city: 'Gainesville',
        state: 'FL',
        zip_code: '32601',
        latitude: 29.6516,
        longitude: -82.3248,
        phone: '352-555-0100',
        website: 'example.org',
        hours_text: 'Call to confirm current hours.',
        eligibility: 'Call to confirm.',
        services_json: '["Primary health care"]',
        tags_json: '["health","community health center"]',
        review_status: 'exception',
        review_note: 'Imported; not independently confirmed.',
        reviewed_at: '2026-07-26T00:00:00.000Z',
        review_due_at: '2026-07-26T00:00:00.000Z',
      },
      { latitude: 29.65, longitude: -82.32 }
    );

    expect(resource.contacts[0]).toMatchObject({
      type: 'phone',
      href: 'tel:3525550100',
    });
    expect(resource.contacts[1]).toMatchObject({
      type: 'website',
      href: 'https://example.org',
    });
    expect(resource.review.sources[0]).toMatchObject({
      name: 'HRSA',
      kind: 'government',
    });
    expect(resource.distanceMiles).toBeGreaterThanOrEqual(0);
  });
});
