const SITE_URL =
  process.env.HEARTH_SITE_URL ??
  'https://automatedworkflowllc-design.github.io/hearth/';
const API_URL =
  process.env.HEARTH_API_URL ??
  'https://hearth-directory.automaticworkflowllc.workers.dev';
const SITE_ORIGIN = new URL(SITE_URL).origin;
const currentMonth = new Date().getUTCMonth() + 1;
const summerMealsExpected = currentMonth >= 6 && currentMonth <= 8;

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchWithTimeout(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15_000),
  });
  return response;
}

async function readJson(response, label) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} returned invalid JSON (HTTP ${response.status}).`);
  }
}

async function checkSite() {
  const response = await fetchWithTimeout(SITE_URL);
  const html = await response.text();

  ensure(response.status === 200, `Public site returned HTTP ${response.status}.`);
  ensure(
    html.includes('<title>Hearth — Find support near you</title>'),
    'Public site did not contain the expected Hearth title.',
  );

  return { status: response.status, url: response.url };
}

async function checkHealth() {
  const response = await fetchWithTimeout(`${API_URL}/health`, {
    headers: { Origin: SITE_ORIGIN },
  });
  const health = await readJson(response, 'Health endpoint');

  ensure(response.status === 200, `Health endpoint returned HTTP ${response.status}.`);
  ensure(health.ok === true, 'Directory health endpoint reported a degraded state.');
  ensure(
    health.data?.activeResources >= 30_000,
    `Active resource count is unexpectedly low: ${health.data?.activeResources ?? 'missing'}.`,
  );
  ensure(
    health.data?.zipCentroids >= 30_000,
    `ZIP centroid count is unexpectedly low: ${health.data?.zipCentroids ?? 'missing'}.`,
  );
  ensure(health.data?.fresh === true, 'Directory import is stale.');
  ensure(
    health.data?.sources?.HRSA >= 15_000,
    `HRSA resource count is unexpectedly low: ${health.data?.sources?.HRSA ?? 'missing'}.`,
  );
  ensure(
    health.data?.sources?.SAMHSA >= 15_000,
    `SAMHSA resource count is unexpectedly low: ${health.data?.sources?.SAMHSA ?? 'missing'}.`,
  );
  ensure(
    health.data?.sources?.['EPA / Hunger Free America'] >= 4_000,
    `EPA / Hunger Free America resource count is unexpectedly low: ${
      health.data?.sources?.['EPA / Hunger Free America'] ?? 'missing'
    }.`,
  );
  if (summerMealsExpected) {
    ensure(
      health.data?.sources?.['USDA SUN Meals'] >= 1_000,
      `Current USDA SUN Meals count is unexpectedly low: ${
        health.data?.sources?.['USDA SUN Meals'] ?? 'missing'
      }.`,
    );
  }
  ensure(
    response.headers.get('access-control-allow-origin') === SITE_ORIGIN,
    'Health endpoint returned an unexpected CORS origin.',
  );

  return health;
}

async function checkBehavioralHealthSearch() {
  const searchUrl = new URL('/v1/resources/search', API_URL);
  searchUrl.search = new URLSearchParams({
    need: 'mental-health',
    sort: 'distance',
    zip: '10001',
    limit: '5',
    probe: String(Date.now()),
  }).toString();

  const response = await fetchWithTimeout(searchUrl, {
    headers: { Origin: SITE_ORIGIN },
  });
  const result = await readJson(response, 'Behavioral-health search endpoint');

  ensure(
    response.status === 200,
    `Behavioral-health search returned HTTP ${response.status}.`,
  );
  ensure(result.total > 0, 'Known-good behavioral-health search returned no resources.');
  ensure(
    result.resources?.every(
      (resource) =>
        resource.tags?.includes('mental health') &&
        resource.review?.sources?.some((source) => source.name === 'SAMHSA'),
    ),
    'Mental-health filter returned a resource outside the requested need.',
  );

  return {
    status: response.status,
    total: result.total,
    returned: result.resources.length,
    firstResource: result.resources[0]?.name,
    firstDistanceMiles: result.resources[0]?.distanceMiles,
  };
}

async function checkNeedFilters() {
  const cases = [
    {
      need: 'food-assistance',
      matches: (resource) =>
        resource.category === 'food' &&
        resource.review?.sources?.some(
          (source) => source.name === 'EPA / Hunger Free America',
        ),
    },
    ...(summerMealsExpected
      ? [
          {
            need: 'summer-meals',
            matches: (resource) =>
              resource.category === 'food' &&
              resource.review?.sources?.some((source) => source.name === 'USDA SUN Meals'),
          },
        ]
      : []),
    {
      need: 'medical-care',
      matches: (resource) =>
        resource.review?.sources?.some((source) => source.name === 'HRSA'),
    },
    {
      need: 'substance-use',
      matches: (resource) => resource.tags?.includes('substance use treatment'),
    },
    {
      need: 'detox',
      matches: (resource) => resource.tags?.includes('detoxification'),
    },
  ];

  return Promise.all(
    cases.map(async ({ need, matches }) => {
      const searchUrl = new URL('/v1/resources/search', API_URL);
      searchUrl.search = new URLSearchParams({
        need,
        sort: 'distance',
        zip: '10001',
        limit: '5',
        probe: String(Date.now()),
      }).toString();
      const response = await fetchWithTimeout(searchUrl, {
        headers: { Origin: SITE_ORIGIN },
      });
      const result = await readJson(response, `${need} search endpoint`);
      ensure(response.status === 200, `${need} search returned HTTP ${response.status}.`);
      ensure(result.total > 0, `${need} search returned no resources.`);
      ensure(
        result.resources?.every(matches),
        `${need} search returned a resource outside the requested need.`,
      );
      return {
        need,
        total: result.total,
        returned: result.resources.length,
        firstResource: result.resources[0]?.name,
      };
    }),
  );
}

async function checkSearch() {
  const searchUrl = new URL('/v1/resources/search', API_URL);
  searchUrl.search = new URLSearchParams({
    sort: 'distance',
    zip: '32601',
    limit: '5',
  }).toString();

  const response = await fetchWithTimeout(searchUrl, {
    headers: { Origin: SITE_ORIGIN },
  });
  const result = await readJson(response, 'Search endpoint');

  ensure(response.status === 200, `Search endpoint returned HTTP ${response.status}.`);
  ensure(result.total > 0, 'Known-good ZIP search returned no resources.');
  ensure(result.resources?.length > 0, 'Known-good ZIP search returned an empty page.');
  ensure(
    result.resources.every(
      (resource) =>
        typeof resource.distanceMiles === 'number' &&
        Number.isFinite(resource.distanceMiles),
    ),
    'Distance search returned a resource without a valid distance.',
  );
  ensure(
    response.headers.get('access-control-allow-origin') === SITE_ORIGIN,
    'Search endpoint returned an unexpected CORS origin.',
  );

  return {
    status: response.status,
    total: result.total,
    returned: result.resources.length,
    firstResource: result.resources[0]?.name,
    firstDistanceMiles: result.resources[0]?.distanceMiles,
  };
}

async function checkInvalidInput() {
  const response = await fetchWithTimeout(
    `${API_URL}/v1/resources/search?lat=999&lng=0`,
    { headers: { Origin: SITE_ORIGIN } },
  );
  const result = await readJson(response, 'Invalid-input check');

  ensure(response.status === 400, `Invalid coordinates returned HTTP ${response.status}.`);
  ensure(result.error === 'Invalid latitude.', 'Invalid coordinates returned the wrong error.');

  return { status: response.status, error: result.error };
}

const startedAt = Date.now();
const [site, health, search, behavioralHealthSearch, needFilters, invalidInput] = await Promise.all([
  checkSite(),
  checkHealth(),
  checkSearch(),
  checkBehavioralHealthSearch(),
  checkNeedFilters(),
  checkInvalidInput(),
]);

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      site,
      directory: {
        activeResources: health.data.activeResources,
        zipCentroids: health.data.zipCentroids,
        latestImport: health.data.latestImport,
      },
      search,
      behavioralHealthSearch,
      needFilters,
      invalidInput,
    },
    null,
    2,
  ),
);
