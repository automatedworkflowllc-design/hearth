const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_OFFSET = 10_000;
const SEARCH_RADIUS_MILES = 75;
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
  hours_text: string;
  eligibility: string | null;
  services_json: string;
  tags_json: string;
  review_status: 'standard' | 'exception';
  review_note: string | null;
  reviewed_at: string;
  review_due_at: string;
}

interface ZipCentroidRow {
  latitude: number;
  longitude: number;
}

export interface SearchOptions {
  query?: string;
  category?: string;
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

function allowedOrigin(request: Request, env: Env): string {
  const configured = env.ALLOWED_ORIGIN?.trim();
  if (!configured || configured === '*') return '*';
  return request.headers.get('Origin') === configured ? configured : configured;
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

  return {
    query: clean(url.searchParams.get('q'), 160),
    category: clean(url.searchParams.get('category'), 40),
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
  const conditions = ['active = 1'];
  const bindings: unknown[] = [];

  if (options.category && options.category.toLowerCase() !== 'all') {
    conditions.push('category = ?');
    bindings.push(options.category.toLowerCase());
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
      website, hours_text, eligibility, services_json, tags_json, review_status,
      review_note, reviewed_at, review_due_at
    FROM resources
    WHERE ${where}`;
  const order = resolvedLocation
    ? 'ORDER BY ((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?)), name'
    : 'ORDER BY name';
  const orderingBindings = resolvedLocation
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

function contactHref(type: 'phone' | 'website', value: string): string {
  if (type === 'phone') return `tel:${value.replace(/[^\d+]/g, '')}`;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
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
  const contacts = [];
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
    availabilityStatus: 'unknown',
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

  if (location && options.sort === 'distance') {
    resources.sort(
      (left, right) =>
        (left.distanceMiles ?? Number.POSITIVE_INFINITY) -
        (right.distanceMiles ?? Number.POSITIVE_INFINITY)
    );
  } else {
    resources.sort((left, right) => left.name.localeCompare(right.name));
  }

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
        sources: ['HRSA'],
      },
    },
    200,
    allowedOrigin(request, env)
  );
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = allowedOrigin(request, env);

  if (request.method === 'OPTIONS') return json({}, 204, origin);
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405, origin);
  }
  if (url.pathname === '/health') {
    return json({ ok: true, service: 'hearth-directory' }, 200, origin);
  }
  if (url.pathname !== '/v1/resources/search') {
    return json({ error: 'Not found.' }, 404, origin);
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
