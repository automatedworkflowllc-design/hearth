import { describe, expect, it } from 'vitest';
import {
  buildResourceQuery,
  freshnessWindowFor,
  handleRequest,
  parseSearchOptions,
  rowToResource,
} from '../../worker/src/index';

function healthEnvironment({
  activeResources = 18_885,
  zipCentroids = 33_791,
  completedAt = new Date().toISOString(),
  sources = { HRSA: 18_885 },
}: {
  activeResources?: number;
  zipCentroids?: number;
  completedAt?: string;
  sources?: Record<string, number>;
} = {}) {
  return {
    DB: {
      prepare(sql: string) {
        return {
          bind() {
            return this;
          },
          async all<T>() {
            if (sql.includes('FROM import_runs')) {
              // One completed run per expected source -- /health is only green
              // when EVERY source is fresh, so the fixture must cover all four.
              return {
                results: [
                  'HRSA',
                  'SAMHSA',
                  'USDA SUN Meals',
                  'EPA / Hunger Free America',
                ].map((source_name) => ({
                  source_name,
                  completed_at: completedAt,
                  imported_count: activeResources,
                  skipped_count: 0,
                })) as T[],
              };
            }
            if (sql.includes('GROUP BY source_name')) {
              return {
                results: Object.entries(sources).map(([source_name, total]) => ({
                  source_name,
                  total,
                })) as T[],
              };
            }
            return { results: [] as T[] };
          },
          async first<T>() {
            if (sql.includes('resources WHERE active = 1')) {
              return { total: activeResources } as T;
            }
            if (sql.includes('zip_centroids')) return { total: zipCentroids } as T;
            return null;
          },
        };
      },
    },
    ALLOWED_ORIGIN: 'https://automatedworkflowllc-design.github.io',
  };
}

describe('national directory worker', () => {
  it('bounds public search inputs and produces a safe parameterized query', () => {
    const options = parseSearchOptions(
      new URL(
        'https://directory.example/v1/resources/search?q=health&category=health&need=mental-health&zip=32601&limit=999'
      )
    );
    const query = buildResourceQuery(options, {
      latitude: 29.6516,
      longitude: -82.3248,
    });

    expect(options.limit).toBe(100);
    expect(options.zip).toBe('32601');
    expect(options.need).toBe('mental-health');
    expect(query.sql).toContain('search_text LIKE ?');
    expect(query.sql).toContain('tags_json LIKE ?');
    expect(query.sql).not.toContain('health');
    expect(query.pageBindings).toContain('%health%');
    expect(query.pageBindings).toContain('%"mental health"%');
    expect(query.pageBindings.at(-2)).toBe(100);
  });

  it('rejects malformed coordinates and cursors', () => {
    expect(() =>
      parseSearchOptions(new URL('https://directory.example/v1/resources/search?lat=29'))
    ).toThrow(/together/i);
    expect(() =>
      parseSearchOptions(new URL('https://directory.example/v1/resources/search?cursor=not-base64'))
    ).toThrow(/cursor/i);
    expect(() =>
      parseSearchOptions(new URL('https://directory.example/v1/resources/search?need=warm-bed'))
    ).toThrow(/need filter/i);
  });

  it('maps supported need filters to precise source and tag constraints', () => {
    const medical = buildResourceQuery({
      need: 'medical-care',
      sort: 'relevance',
      limit: 20,
      offset: 0,
    });
    expect(medical.sql).toContain('source_name = ?');
    expect(medical.bindings).toContain('HRSA');

    const food = buildResourceQuery({
      need: 'food',
      sort: 'relevance',
      limit: 20,
      offset: 0,
    });
    expect(food.sql).toContain('category = ?');
    expect(food.bindings).toContain('food');

    const foodAssistance = buildResourceQuery({
      need: 'food-assistance',
      sort: 'relevance',
      limit: 20,
      offset: 0,
    });
    expect(foodAssistance.sql).toContain('source_name = ?');
    expect(foodAssistance.bindings).toContain('EPA / Hunger Free America');

    const summerMeals = buildResourceQuery({
      need: 'summer-meals',
      sort: 'relevance',
      limit: 20,
      offset: 0,
    });
    expect(summerMeals.bindings).toContain('USDA SUN Meals');

    const substanceUse = buildResourceQuery({
      need: 'substance-use',
      sort: 'relevance',
      limit: 20,
      offset: 0,
    });
    expect(substanceUse.sql).toContain('tags_json LIKE ?');
    expect(substanceUse.bindings).toContain('%"substance use treatment"%');

    const detox = buildResourceQuery({
      need: 'detox',
      sort: 'relevance',
      limit: 20,
      offset: 0,
    });
    expect(detox.bindings).toContain('%"detoxification"%');
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
        contacts_json: '[]',
        hours_text: 'Call to confirm current hours.',
        eligibility: 'Call to confirm.',
        services_json: '["Primary health care"]',
        tags_json: '["health","community health center"]',
        review_status: 'exception',
        review_note: 'Imported; not independently confirmed.',
        reviewed_at: '2026-07-26T00:00:00.000Z',
        review_due_at: '2026-07-26T00:00:00.000Z',
        availability_start: null,
        availability_end: null,
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

  it('maps structured SAMHSA phone and intake contacts', () => {
    const resource = rowToResource({
      id: 'samhsa:example',
      source_name: 'SAMHSA',
      source_url: 'https://www.samhsa.gov/data/',
      source_updated_at: '2026-03-06T00:00:00.000Z',
      fetched_at: '2026-07-26T00:00:00.000Z',
      name: 'Example Behavioral Health',
      category: 'health',
      description: 'A SAMHSA directory facility.',
      address: '100 Main St',
      city: 'Gainesville',
      state: 'FL',
      zip_code: '32601',
      latitude: 29.6516,
      longitude: -82.3248,
      phone: '352-555-0100',
      website: null,
      contacts_json: JSON.stringify([
        {
          type: 'phone',
          label: 'Main phone',
          value: '352-555-0100',
          primary: true,
        },
        {
          type: 'intake',
          label: 'Intake line',
          value: '877-555-0101 x2',
        },
      ]),
      hours_text: 'Call to confirm current hours.',
      eligibility: 'Call to confirm.',
      services_json: '["Mental health treatment"]',
      tags_json: '["behavioral health","mental health"]',
      review_status: 'exception',
      review_note: 'Facility-reported listing.',
      reviewed_at: '2026-07-26T00:00:00.000Z',
      review_due_at: '2026-07-26T00:00:00.000Z',
      availability_start: null,
      availability_end: null,
    });

    expect(resource.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'phone',
          href: 'tel:3525550100',
          primary: true,
        }),
        expect.objectContaining({
          type: 'intake',
          href: 'tel:8775550101;ext=2',
        }),
      ])
    );
  });

  it('maps a seasonal USDA meal site and its operating window', () => {
    const resource = rowToResource({
      id: 'usda-sun-meals:example',
      source_name: 'USDA SUN Meals',
      source_url: 'https://www.fns.usda.gov/summer/sitefinder',
      source_updated_at: '2026-07-25T00:00:00.000Z',
      fetched_at: '2026-07-26T00:00:00.000Z',
      name: 'Example Summer Meal Site',
      category: 'food',
      description: 'Free summer meals for children age 18 and under.',
      address: '100 Main St',
      city: 'Gainesville',
      state: 'FL',
      zip_code: '32601',
      latitude: 29.6516,
      longitude: -82.3248,
      phone: '352-555-0100',
      website: null,
      contacts_json: '[]',
      hours_text: 'Season: June 1, 2026–August 1, 2026.',
      eligibility: 'Free for children age 18 and under.',
      services_json: '["Free summer lunch"]',
      tags_json: '["food","free meals","lunch"]',
      review_status: 'exception',
      review_note: 'State-submitted seasonal listing; call before traveling.',
      reviewed_at: '2026-07-26T00:00:00.000Z',
      review_due_at: '2026-08-01T23:59:59.999Z',
      availability_start: '2026-06-01',
      availability_end: '2026-08-01',
    });

    expect(resource).toMatchObject({
      category: 'food',
      availability: 'Available 2026-06-01 through 2026-08-01',
      availabilityStatus: 'open',
      review: {
        sources: [
          expect.objectContaining({
            name: 'USDA SUN Meals',
            kind: 'government',
          }),
        ],
      },
    });
  });

  it('reports database counts and import freshness from the health endpoint', async () => {
    const response = await handleRequest(
      new Request('https://directory.example/health', {
        headers: { Origin: 'https://automatedworkflowllc-design.github.io' },
      }),
      healthEnvironment()
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      service: 'hearth-directory',
      data: {
        activeResources: 18_885,
        zipCentroids: 33_791,
        sources: { HRSA: 18_885 },
        fresh: true,
        staleSources: [],
        latestImport: {
          source: 'HRSA',
          importedCount: 18_885,
        },
      },
    });
    // Freshness is now per-source: all four expected sources must be present.
    expect(payload.data.imports).toHaveLength(4);
    expect(payload.data.imports.every((row: { fresh: boolean }) => row.fresh)).toBe(true);
  });

  it('fails health when one source is stale, even if another is fresh', async () => {
    // The pre-fix behavior: one recent import kept /health green while any other
    // source rotted indefinitely. This pins the fix.
    const environment = healthEnvironment();
    const originalPrepare = environment.DB.prepare.bind(environment.DB);
    environment.DB.prepare = (sql: string) => {
      const statement = originalPrepare(sql);
      if (sql.includes('FROM import_runs')) {
        return {
          ...statement,
          async all<T>() {
            return {
              results: [
                { source_name: 'HRSA', completed_at: new Date().toISOString(), imported_count: 1, skipped_count: 0 },
                { source_name: 'SAMHSA', completed_at: new Date().toISOString(), imported_count: 1, skipped_count: 0 },
                { source_name: 'USDA SUN Meals', completed_at: new Date().toISOString(), imported_count: 1, skipped_count: 0 },
                { source_name: 'EPA / Hunger Free America', completed_at: '2020-01-01T00:00:00.000Z', imported_count: 1, skipped_count: 0 },
              ] as T[],
            };
          },
        };
      }
      return statement;
    };
    const response = await handleRequest(
      new Request('https://directory.example/health'),
      environment
    );
    const payload = await response.json();
    // Stale data is reported at 200 with ok:false -- the directory can still serve.
    // What must not regress is that it is still NOT ok and still names the source.
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(false);
    expect(payload.data.fresh).toBe(false);
    expect(payload.data.degraded).toBe(true);
    expect(payload.data.servable).toBe(true);
    expect(payload.data.staleSources).toContain('EPA / Hunger Free America');
  });

  it('fails health checks when the latest completed import is stale', async () => {
    const response = await handleRequest(
      new Request('https://directory.example/health'),
      healthEnvironment({ completedAt: '2020-01-01T00:00:00.000Z' })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: false,
      data: { fresh: false, degraded: true, servable: true },
    });
  });

  it('reserves 503 for a directory that genuinely cannot serve', async () => {
    // The distinction the status code now carries. Zero resources is not "data is
    // a bit old" -- a search returns nothing, so the service really is unavailable.
    const response = await handleRequest(
      new Request('https://directory.example/health'),
      healthEnvironment({ activeResources: 0 })
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.data.servable).toBe(false);
    expect(payload.data.degraded).toBe(false);
  });

  it('judges a monthly source against its own cadence, not the weekly window', async () => {
    // The defect this fixes, as an exact reproduction. SAMHSA refreshes MONTHLY
    // ('31 11 1 * *') and was judged against one global 14-day window, so it went
    // stale ~17 days into every month with nothing wrong. 20 days old is normal
    // for a monthly source and must be fresh; the same age on weekly HRSA must not.
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 3_600_000).toISOString();
    const now = new Date().toISOString();
    const withAges = (ages: Record<string, string>) => {
      const environment = healthEnvironment();
      const originalPrepare = environment.DB.prepare.bind(environment.DB);
      environment.DB.prepare = (sql: string) => {
        const statement = originalPrepare(sql);
        if (sql.includes('FROM import_runs')) {
          return {
            ...statement,
            async all<T>() {
              return {
                results: Object.entries(ages).map(([source_name, completed_at]) => ({
                  source_name,
                  completed_at,
                  imported_count: 1,
                  skipped_count: 0,
                })) as T[],
              };
            },
          };
        }
        return statement;
      };
      return environment;
    };

    const monthlyLate = await handleRequest(
      new Request('https://directory.example/health'),
      withAges({
        HRSA: now,
        SAMHSA: twentyDaysAgo,
        'USDA SUN Meals': now,
        'EPA / Hunger Free America': twentyDaysAgo,
      })
    );
    const monthlyPayload = await monthlyLate.json();
    expect(monthlyPayload.ok).toBe(true);
    expect(monthlyPayload.data.staleSources).toEqual([]);

    // NEGATIVE CONTROL: the identical age on the WEEKLY source must still go red.
    // Without this the test above would also pass if freshness stopped working.
    const weeklyLate = await handleRequest(
      new Request('https://directory.example/health'),
      withAges({
        HRSA: twentyDaysAgo,
        SAMHSA: now,
        'USDA SUN Meals': now,
        'EPA / Hunger Free America': now,
      })
    );
    const weeklyPayload = await weeklyLate.json();
    expect(weeklyPayload.ok).toBe(false);
    expect(weeklyPayload.data.staleSources).toContain('HRSA');
  });

  it('applies each source its own window, and only suspends the seasonal one out of season', () => {
    // Tested against EXPLICIT dates rather than "now". The health-endpoint test
    // below can only exercise whichever branch the real calendar is in, so for six
    // months of the year it would silently stop checking the other one. These two
    // fixed dates check both halves regardless of when the suite runs.
    const july = new Date('2026-07-15T00:00:00.000Z');
    const january = new Date('2026-01-15T00:00:00.000Z');

    // A monthly source gets a monthly window -- the whole point of the fix.
    expect(freshnessWindowFor('SAMHSA', july)).toBe(24 * 45);
    expect(freshnessWindowFor('EPA / Hunger Free America', july)).toBe(24 * 45);
    // A weekly source keeps the tight one, so lateness is still caught.
    expect(freshnessWindowFor('HRSA', july)).toBe(24 * 14);
    expect(freshnessWindowFor('HRSA', january)).toBe(24 * 14);

    // Seasonal: judged in season, not due out of season.
    expect(freshnessWindowFor('USDA SUN Meals', july)).toBe(24 * 14);
    expect(freshnessWindowFor('USDA SUN Meals', january)).toBeNull();

    // Season boundaries, since 'May-Oct' is the kind of range that is off by one.
    expect(freshnessWindowFor('USDA SUN Meals', new Date('2026-05-01T00:00:00.000Z'))).toBe(24 * 14);
    expect(freshnessWindowFor('USDA SUN Meals', new Date('2026-10-31T00:00:00.000Z'))).toBe(24 * 14);
    expect(freshnessWindowFor('USDA SUN Meals', new Date('2026-04-30T00:00:00.000Z'))).toBeNull();
    expect(freshnessWindowFor('USDA SUN Meals', new Date('2026-11-01T00:00:00.000Z'))).toBeNull();

    // An unknown source is not silently exempt -- it falls back to the tight window.
    expect(freshnessWindowFor('Some Future Source', july)).toBe(24 * 14);
  });

  it('does not call a seasonal source stale while it is out of season', async () => {
    // USDA SUN Meals runs weekly May-Oct only. A fixed window would report it stale
    // every November through April with nothing wrong. Its rows are already hidden
    // out of season by availability_start/end, so dormancy is not a health problem.
    const longAgo = new Date(Date.now() - 200 * 24 * 3_600_000).toISOString();
    const environment = healthEnvironment();
    const originalPrepare = environment.DB.prepare.bind(environment.DB);
    environment.DB.prepare = (sql: string) => {
      const statement = originalPrepare(sql);
      if (sql.includes('FROM import_runs')) {
        return {
          ...statement,
          async all<T>() {
            return {
              results: [
                { source_name: 'HRSA', completed_at: new Date().toISOString(), imported_count: 1, skipped_count: 0 },
                { source_name: 'SAMHSA', completed_at: new Date().toISOString(), imported_count: 1, skipped_count: 0 },
                { source_name: 'USDA SUN Meals', completed_at: longAgo, imported_count: 1, skipped_count: 0 },
                { source_name: 'EPA / Hunger Free America', completed_at: new Date().toISOString(), imported_count: 1, skipped_count: 0 },
              ] as T[],
            };
          },
        };
      }
      return statement;
    };

    const response = await handleRequest(
      new Request('https://directory.example/health'),
      environment
    );
    const payload = await response.json();
    const usda = payload.data.imports.find(
      (row: { source: string }) => row.source === 'USDA SUN Meals'
    );
    const inSeason = [5, 6, 7, 8, 9, 10].includes(new Date().getUTCMonth() + 1);

    // Asserted both ways so the test means something in either half of the year,
    // rather than silently passing for six months because it is currently summer.
    if (inSeason) {
      expect(usda.dormant).toBe(false);
      expect(usda.fresh).toBe(false);
      expect(payload.data.staleSources).toContain('USDA SUN Meals');
    } else {
      expect(usda.dormant).toBe(true);
      expect(usda.fresh).toBe(true);
      expect(payload.data.staleSources).not.toContain('USDA SUN Meals');
    }
  });
});
