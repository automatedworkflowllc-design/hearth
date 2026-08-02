const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_OFFSET = 10_000;
const SEARCH_RADIUS_MILES = 75;
const MAX_IMPORT_AGE_HOURS = 24 * 14;

// Every source the directory is built on. /health is only green when each of these
// has a completed import inside the freshness window -- add new sources here so a
// forgotten import can never hide behind the others.
const EXPECTED_SOURCES = [
  'HRSA',
  'SAMHSA',
  'USDA SUN Meals',
  'EPA / Hunger Free America',
] as const;
const HRSA_SOURCE_URL = 'https://data.hrsa.gov/topics/health-centers';

interface D1Result<T> {
  results: T[];
}

interface DirectoryStatement {
  bind(...values: unknown[]): DirectoryStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
}

interface DirectoryDatabase {
  prepare(sql: string): DirectoryStatement;
}

interface Env {
  DB: DirectoryDatabase;
  ALLOWED_ORIGIN?: string;
  /** Cloudflare ratelimit binding (wrangler.jsonc unsafe.bindings). Optional so
   * tests and local dev without the binding fall back to the in-isolate Map. */
  SEARCH_RATE?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

interface ResourceRow {
  id: string;
  source_name: string;
  source_url: string;
  source_updated_at: string | null;
  fetched_at: string;
  name: string;
  category: string;
  description: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  contacts_json: string;
  hours_text: string;
  eligibility: string | null;
  services_json: string;
  tags_json: string;
  review_status: 'standard' | 'exception';
  review_note: string | null;
  reviewed_at: string;
  review_due_at: string;
  availability_start: string | null;
  availability_end: string | null;
}

interface ZipCentroidRow {
  latitude: number;
  longitude: number;
}

interface ImportRunRow {
  source_name: string;
  completed_at: string;
  imported_count: number;
  skipped_count: number;
}

interface SourceCountRow {
  source_name: string;
  total: number;
}

type StoredContactType = 'phone' | 'sms' | 'email' | 'website' | 'chat' | 'intake';

interface StoredContact {
  type: StoredContactType;
  label: string;
  value: string;
  primary?: boolean;
  note?: string;
}

// USDA operating dates are local calendar dates, but the national feed does not
// provide a timezone. UTC-10 is the last U.S. timezone to enter a new date; this
// avoids hiding an end-date meal while it is still that day anywhere in the U.S.
const CURRENT_US_DATE_SQL = "date('now','-10 hours')";
const CURRENTLY_AVAILABLE_SQL =
  `active = 1 AND (availability_start IS NULL OR availability_start <= ${CURRENT_US_DATE_SQL}) ` +
  `AND (availability_end IS NULL OR availability_end >= ${CURRENT_US_DATE_SQL})`;

export interface SearchOptions {
  query?: string;
  category?: string;
  need?:
    | 'food'
    | 'food-assistance'
    | 'summer-meals'
    | 'medical-care'
    | 'mental-health'
    | 'substance-use'
    | 'detox';
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  sort: 'distance' | 'name' | 'relevance';
  limit: number;
  offset: number;
}

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
}

export interface BuiltQuery {
  sql: string;
  countSql: string;
  bindings: unknown[];
  pageBindings: unknown[];
}

function json(value: unknown, status = 200, origin = '*'): Response {
  return new Response(status === 204 ? null : JSON.stringify(value), {
    status,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Origin': origin,
      'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function allowedOrigin(_request: Request, env: Env): string {
  const configured = env.ALLOWED_ORIGIN?.trim();
  if (!configured || configured === '*') return '*';
  // Always the single configured origin. The previous version compared the request
  // Origin and then returned `configured` on BOTH branches -- a dead ternary that
  // read like origin validation but did nothing. Browsers enforce the mismatch:
  // a foreign origin receives ACAO for the locked origin and is blocked client-side.
  return configured;
}

function clean(value: string | null, maximumLength = 120): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized ? normalized.slice(0, maximumLength) : undefined;
}

function parseCoordinate(
  value: string | null,
  minimum: number,
  maximum: number,
  label: string
): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`Invalid ${label}.`);
  }
  return parsed;
}

function decodeCursor(value: string | null): number {
  if (!value) return 0;
  try {
    const offset = Number(atob(value));
    if (Number.isInteger(offset) && offset >= 0 && offset <= MAX_OFFSET) return offset;
  } catch {
    // Fall through to the stable client error below.
  }
  throw new Error('Invalid cursor.');
}

function encodeCursor(offset: number): string {
  return btoa(String(offset));
}

export function parseSearchOptions(url: URL): SearchOptions {
  const latitude = parseCoordinate(url.searchParams.get('lat'), -90, 90, 'latitude');
  const longitude = parseCoordinate(url.searchParams.get('lng'), -180, 180, 'longitude');
  if ((latitude === undefined) !== (longitude === undefined)) {
    throw new Error('Latitude and longitude must be provided together.');
  }

  const zipValue = clean(url.searchParams.get('zip'), 10);
  if (zipValue && !/^\d{5}(?:-\d{4})?$/.test(zipValue)) {
    throw new Error('Invalid ZIP code.');
  }

  const requestedLimit = Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.floor(requestedLimit), MAX_LIMIT))
    : DEFAULT_LIMIT;
  const requestedSort = url.searchParams.get('sort');
  const sort =
    requestedSort === 'distance' || requestedSort === 'name' || requestedSort === 'relevance'
      ? requestedSort
      : 'relevance';
  const requestedNeed = clean(url.searchParams.get('need'), 40)?.toLowerCase();
  const supportedNeeds = new Set([
    'food',
    'food-assistance',
    'summer-meals',
    'medical-care',
    'mental-health',
    'substance-use',
    'detox',
  ]);
  if (requestedNeed && requestedNeed !== 'all' && !supportedNeeds.has(requestedNeed)) {
    throw new Error('Invalid need filter.');
  }

  return {
    query: clean(url.searchParams.get('q'), 160),
    category: clean(url.searchParams.get('category'), 40),
    need:
      requestedNeed && requestedNeed !== 'all'
        ? (requestedNeed as SearchOptions['need'])
        : undefined,
    city: clean(url.searchParams.get('city'), 80),
    zip: zipValue?.slice(0, 5),
    latitude,
    longitude,
    sort,
    limit,
    offset: decodeCursor(url.searchParams.get('cursor')),
  };
}

export function buildResourceQuery(
  options: SearchOptions,
  resolvedLocation?: ResolvedLocation
): BuiltQuery {
  const conditions = [CURRENTLY_AVAILABLE_SQL];
  const bindings: unknown[] = [];

  if (options.category && options.category.toLowerCase() !== 'all') {
    conditions.push('category = ?');
    bindings.push(options.category.toLowerCase());
  }
  if (options.need === 'food') {
    conditions.push('category = ?');
    bindings.push('food');
  } else if (options.need === 'food-assistance') {
    conditions.push('source_name = ?');
    bindings.push('EPA / Hunger Free America');
  } else if (options.need === 'summer-meals') {
    conditions.push('source_name = ?');
    bindings.push('USDA SUN Meals');
  } else if (options.need === 'medical-care') {
    conditions.push('source_name = ?');
    bindings.push('HRSA');
  } else if (options.need === 'mental-health') {
    conditions.push('tags_json LIKE ?');
    bindings.push('%"mental health"%');
  } else if (options.need === 'substance-use') {
    conditions.push('tags_json LIKE ?');
    bindings.push('%"substance use treatment"%');
  } else if (options.need === 'detox') {
    conditions.push('tags_json LIKE ?');
    bindings.push('%"detoxification"%');
  }
  if (options.city) {
    conditions.push('LOWER(city) = ?');
    bindings.push(options.city.toLowerCase());
  }
  if (options.query) {
    conditions.push('search_text LIKE ?');
    bindings.push(`%${options.query.toLowerCase()}%`);
  }

  if (resolvedLocation) {
    const latitudeWindow = SEARCH_RADIUS_MILES / 69;
    const longitudeScale = Math.max(Math.cos((resolvedLocation.latitude * Math.PI) / 180), 0.2);
    const longitudeWindow = SEARCH_RADIUS_MILES / (69 * longitudeScale);
    conditions.push('latitude BETWEEN ? AND ?');
    bindings.push(
      resolvedLocation.latitude - latitudeWindow,
      resolvedLocation.latitude + latitudeWindow
    );
    conditions.push('longitude BETWEEN ? AND ?');
    bindings.push(
      resolvedLocation.longitude - longitudeWindow,
      resolvedLocation.longitude + longitudeWindow
    );
  } else if (options.zip) {
    conditions.push('zip_code = ?');
    bindings.push(options.zip);
  }

  const where = conditions.join(' AND ');
  const select = `
    SELECT
      id, source_name, source_url, source_updated_at, fetched_at, name, category,
      description, address, city, state, zip_code, latitude, longitude, phone,
      website, contacts_json, hours_text, eligibility, services_json, tags_json, review_status,
      review_note, reviewed_at, review_due_at, availability_start, availability_end
    FROM resources
    WHERE ${where}`;
  // The SQL ORDER BY is the pagination cursor's total order, so it must match the
  // REQUESTED sort. Previously the SQL always ordered by distance when a location
  // was present while the JS layer re-sorted each page by name -- every 50-row page
  // was the next-nearest slice shown alphabetically, interleaving names across
  // pages and duplicating/skipping rows at cursor boundaries.
  const orderByDistance = resolvedLocation && options.sort === 'distance';
  const order = orderByDistance
    ? 'ORDER BY ((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?)), name'
    : 'ORDER BY name';
  const orderingBindings = orderByDistance && resolvedLocation
    ? [
        resolvedLocation.latitude,
        resolvedLocation.latitude,
        resolvedLocation.longitude,
        resolvedLocation.longitude,
      ]
    : [];

  return {
    sql: `${select} ${order} LIMIT ? OFFSET ?`,
    countSql: `SELECT COUNT(*) AS total FROM resources WHERE ${where}`,
    bindings,
    pageBindings: [...bindings, ...orderingBindings, options.limit, options.offset],
  };
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function contactHref(type: StoredContactType, value: string): string {
  if (type === 'phone' || type === 'intake') {
    const extension = /(?:ext\.?|x)\s*(\d+)/i.exec(value)?.[1];
    const base = value.split(/(?:ext\.?|x)\s*\d+/i, 1)[0].replace(/[^\d+]/g, '');
    return `tel:${base}${extension ? `;ext=${extension}` : ''}`;
  }
  if (type === 'sms') return `sms:${value.replace(/[^\d+]/g, '')}`;
  if (type === 'email') return `mailto:${value}`;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function parseStoredContacts(value: string): StoredContact[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const allowedTypes = new Set<StoredContactType>([
      'phone',
      'sms',
      'email',
      'website',
      'chat',
      'intake',
    ]);
    return parsed.flatMap((candidate): StoredContact[] => {
      if (!candidate || typeof candidate !== 'object') return [];
      const type = candidate.type;
      const label = candidate.label;
      const contactValue = candidate.value;
      if (
        typeof type !== 'string' ||
        !allowedTypes.has(type as StoredContactType) ||
        typeof label !== 'string' ||
        typeof contactValue !== 'string' ||
        !label.trim() ||
        !contactValue.trim()
      ) {
        return [];
      }
      return [
        {
          type: type as StoredContactType,
          label: label.trim(),
          value: contactValue.trim(),
          primary: candidate.primary === true || undefined,
          note:
            typeof candidate.note === 'string' && candidate.note.trim()
              ? candidate.note.trim()
              : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}

function calculateDistanceMiles(
  start: ResolvedLocation,
  latitude: number,
  longitude: number
): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(latitude - start.latitude);
  const longitudeDelta = radians(longitude - start.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(start.latitude)) *
      Math.cos(radians(latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}

export function rowToResource(row: ResourceRow, location?: ResolvedLocation) {
  const contacts = parseStoredContacts(row.contacts_json).map((contact) => ({
    ...contact,
    href: contactHref(contact.type, contact.value),
  }));
  if (!contacts.length) {
    if (row.phone) {
      contacts.push({
        type: 'phone',
        label: 'Call',
        value: row.phone,
        href: contactHref('phone', row.phone),
        primary: true,
        note: 'Call to confirm services, eligibility, and current hours.',
      });
    }
    if (row.website) {
      contacts.push({
        type: 'website',
        label: 'Official website',
        value: row.website,
        href: contactHref('website', row.website),
      });
    }
  }

  const hasCoordinates = row.latitude !== null && row.longitude !== null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    address: row.address ?? undefined,
    location: {
      address: row.address ?? undefined,
      city: row.city ?? undefined,
      state: row.state ?? undefined,
      zipCode: row.zip_code ?? undefined,
      lat: row.latitude ?? undefined,
      lng: row.longitude ?? undefined,
    },
    contacts,
    hours: row.hours_text,
    eligibility: row.eligibility ?? undefined,
    services: parseStringArray(row.services_json),
    tags: parseStringArray(row.tags_json),
    availability:
      row.availability_start && row.availability_end
        ? `Available ${row.availability_start} through ${row.availability_end}`
        : undefined,
    availabilityStatus:
      row.availability_start && row.availability_end ? 'open' : 'unknown',
    distanceMiles:
      location && hasCoordinates
        ? calculateDistanceMiles(location, row.latitude as number, row.longitude as number)
        : undefined,
    review: {
      reviewedAt: row.reviewed_at,
      reviewDueAt: row.review_due_at,
      status: row.review_status,
      note:
        row.review_note ??
        'Imported from an authoritative source; call to confirm time-sensitive details.',
      sources: [
        {
          name: row.source_name,
          url: row.source_url || HRSA_SOURCE_URL,
          kind: 'government',
        },
      ],
    },
    accessibility: {
      wheelchair: 'unknown',
      notes: ['Accessibility information is not included in this source dataset.'],
    },
  };
}

async function resolveLocation(
  database: DirectoryDatabase,
  options: SearchOptions
): Promise<ResolvedLocation | undefined> {
  if (options.latitude !== undefined && options.longitude !== undefined) {
    return { latitude: options.latitude, longitude: options.longitude };
  }
  if (!options.zip) return undefined;
  const centroid = await database
    .prepare('SELECT latitude, longitude FROM zip_centroids WHERE zip_code = ?')
    .bind(options.zip)
    .first<ZipCentroidRow>();
  return centroid ?? undefined;
}

async function search(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const options = parseSearchOptions(url);
  const location = await resolveLocation(env.DB, options);
  const query = buildResourceQuery(options, location);

  const [page, count] = await Promise.all([
    env.DB.prepare(query.sql).bind(...query.pageBindings).all<ResourceRow>(),
    env.DB.prepare(query.countSql).bind(...query.bindings).first<{ total: number }>(),
  ]);
  const total = count?.total ?? page.results.length;
  const nextOffset = options.offset + page.results.length;
  const resources = page.results.map((row) => rowToResource(row, location));

  // No in-memory re-sort: the SQL ORDER BY is the cursor's total order, and
  // re-sorting a page here is what made pagination interleave and skip rows.
  // Display order and cursor order must be the same order.

  return json(
    {
      resources,
      total,
      facets: {
        languages: [],
        hasWheelchairData: false,
      },
      nextCursor:
        page.results.length === options.limit && nextOffset < total
          ? encodeCursor(nextOffset)
          : null,
      generatedAt: new Date().toISOString(),
      coverage: {
        radiusMiles: location ? SEARCH_RADIUS_MILES : null,
        sources: [...new Set(page.results.map((row) => row.source_name))],
      },
      // A well-formed ZIP that is not in zip_centroids silently degraded to an
      // exact zip_code match -- usually 0 rows -- and the empty state then told the
      // user "no resources near you", which is not what happened. Surface the truth
      // so the client can say "we don't recognize that ZIP" instead.
      zipRecognized: options.zip ? Boolean(location) : null,
    },
    200,
    allowedOrigin(request, env)
  );
}

async function health(request: Request, env: Env): Promise<Response> {
  const [resourceCount, zipCount, sourceCounts, latestImport] = await Promise.all([
    env.DB
      .prepare(`SELECT COUNT(*) AS total FROM resources WHERE ${CURRENTLY_AVAILABLE_SQL}`)
      .first<{ total: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS total FROM zip_centroids').first<{ total: number }>(),
    env.DB
      .prepare(
        `SELECT source_name, COUNT(*) AS total FROM resources WHERE ${CURRENTLY_AVAILABLE_SQL} GROUP BY source_name`
      )
      .all<SourceCountRow>(),
    env.DB
      .prepare(
        // Latest completed run PER SOURCE. The previous LIMIT 1 across all sources
        // meant one healthy import kept /health green while any other source went
        // stale indefinitely -- a freshness light that could not turn red.
        `SELECT source_name, MAX(completed_at) AS completed_at, imported_count, skipped_count
         FROM import_runs
         WHERE status = 'completed' AND completed_at IS NOT NULL
         GROUP BY source_name
         ORDER BY completed_at DESC`
      )
      .all<ImportRunRow>(),
  ]);

  const ageHoursOf = (iso: string | null): number | null => {
    const ms = iso ? Date.parse(iso) : Number.NaN;
    return Number.isFinite(ms)
      ? Math.max(0, Math.round(((Date.now() - ms) / 3_600_000) * 10) / 10)
      : null;
  };
  const importRows = latestImport.results ?? [];
  const imports = importRows.map((row) => {
    const ageHours = ageHoursOf(row.completed_at);
    return {
      source: row.source_name,
      completedAt: row.completed_at,
      importedCount: row.imported_count,
      skippedCount: row.skipped_count,
      ageHours,
      fresh: ageHours !== null && ageHours <= MAX_IMPORT_AGE_HOURS,
    };
  });
  // Fresh means EVERY expected source is within the window and has imported at
  // least once. "Some source somewhere is recent" is not freshness.
  const dataFresh =
    imports.length >= EXPECTED_SOURCES.length && imports.every((row) => row.fresh);
  const newest = imports[0] ?? null;
  const importAgeHours = newest?.ageHours ?? null;
  const activeResources = resourceCount?.total ?? 0;
  const zipCentroids = zipCount?.total ?? 0;
  const sources = Object.fromEntries(
    sourceCounts.results.map((row) => [row.source_name, row.total])
  );
  const ok = activeResources > 0 && zipCentroids > 0 && imports.length > 0 && dataFresh;

  return json(
    {
      ok,
      service: 'hearth-directory',
      checkedAt: new Date().toISOString(),
      data: {
        activeResources,
        zipCentroids,
        sources,
        fresh: dataFresh,
        maximumImportAgeHours: MAX_IMPORT_AGE_HOURS,
        imports,
        staleSources: [
          // Sources past the window, plus expected sources that have never imported.
          ...imports.filter((row) => !row.fresh).map((row) => row.source),
          ...EXPECTED_SOURCES.filter((name) => !imports.some((row) => row.source === name)),
        ],
        // Diagnostic: is the ratelimit binding present and answering? Added while
        // chasing a limiter that never denied; cheap to keep -- it turns "rate
        // limiting exists" from an assumption into an observable.
        rateLimiter: await (async () => {
          if (!env.SEARCH_RATE) return { mode: 'fallback-map', probe: null };
          try {
            const probe = await env.SEARCH_RATE.limit({ key: 'health-probe' });
            return { mode: 'binding', probe };
          } catch (error) {
            return {
              mode: 'binding-error',
              probe: error instanceof Error ? error.message : String(error),
            };
          }
        })(),
        // Kept for compatibility with existing monitors: the newest import overall.
        latestImport: newest
          ? {
              source: newest.source,
              completedAt: newest.completedAt,
              importedCount: newest.importedCount,
              skippedCount: newest.skippedCount,
              ageHours: importAgeHours,
            }
          : null,
      },
    },
    ok ? 200 : 503,
    allowedOrigin(request, env)
  );
}

// Per-IP fixed-window rate limit for the search endpoint. Each search runs an
// unindexable LIKE scan twice (page + COUNT) over ~60k rows, so an unauthenticated
// loop can burn the D1 daily read quota and take the directory down for everyone.
// This is an in-isolate Map: state resets when the isolate recycles and is not
// shared across Cloudflare's edge, so it bounds a single hot client rather than a
// distributed attack -- honest scope, but it converts "one curl loop kills the
// site" into "one curl loop gets 429s". 60/min is far above any human browsing.
const RATE_LIMIT_PER_MINUTE = 60;
const rateWindows = new Map<string, { windowStart: number; count: number }>();

async function rateLimited(request: Request, env: Env): Promise<boolean> {
  const key = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  // Preferred path: Cloudflare's ratelimit binding, shared across isolates in a
  // colo. Measured 2026-08-02: the Map alone let an 80-request/2s burst through
  // untouched because the edge spread it across isolates.
  if (env.SEARCH_RATE) {
    try {
      const { success } = await env.SEARCH_RATE.limit({ key });
      return !success;
    } catch {
      // Binding hiccup: fall through to the Map rather than failing open silently.
    }
  }
  const now = Date.now();
  const window = rateWindows.get(key);
  if (!window || now - window.windowStart >= 60_000) {
    // Cap map growth: a new window is also a cheap moment to shed stale entries.
    if (rateWindows.size > 10_000) rateWindows.clear();
    rateWindows.set(key, { windowStart: now, count: 1 });
    return false;
  }
  window.count += 1;
  return window.count > RATE_LIMIT_PER_MINUTE;
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = allowedOrigin(request, env);

  if (request.method === 'OPTIONS') return json({}, 204, origin);
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405, origin);
  }
  if (url.pathname === '/health') {
    try {
      return await health(request, env);
    } catch {
      return json(
        {
          ok: false,
          service: 'hearth-directory',
          checkedAt: new Date().toISOString(),
          error: 'Directory health data is unavailable.',
        },
        503,
        origin
      );
    }
  }
  if (url.pathname !== '/v1/resources/search') {
    return json({ error: 'Not found.' }, 404, origin);
  }
  if (await rateLimited(request, env)) {
    const response = json(
      { error: 'Too many requests. Please wait a moment and try again, or dial 211 for a live referral.' },
      429,
      origin
    );
    response.headers.set('Retry-After', '30');
    return response;
  }

  try {
    return await search(request, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Directory search failed.';
    const isClientError =
      message.startsWith('Invalid ') || message.startsWith('Latitude and longitude');
    return json(
      { error: isClientError ? message : 'The directory is temporarily unavailable.' },
      isClientError ? 400 : 503,
      origin
    );
  }
}

export default {
  fetch(request: Request, env: Env) {
    return handleRequest(request, env);
  },
};
