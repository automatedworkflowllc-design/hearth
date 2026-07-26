import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_NAME = 'EPA / Hunger Free America';
const SOURCE_URL =
  'https://www.epa.gov/sustainable-management-food/excess-food-opportunities-map';
const LAYER_URL =
  'https://services3.arcgis.com/g6eV2CrSSwCZj8Mc/arcgis/rest/services/EPA_ExcessFoodOpportunities/FeatureServer/7';
const HUNGER_HOTLINE_URL = 'https://www.fns.usda.gov/national-hunger-hotline';
const HUNGER_HOTLINE_PHONE = '1-866-348-6479';
const PAGE_SIZE = 2_000;
const BATCH_SIZE = 25;
const DIRECT_TYPES = new Set(['Food Pantry', 'Soup Kitchen']);
const VALID_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA',
  'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS',
  'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA',
  'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY',
]);
const RESOURCE_COLUMNS = [
  'id',
  'source_name',
  'source_record_id',
  'source_url',
  'source_updated_at',
  'fetched_at',
  'name',
  'category',
  'description',
  'address',
  'city',
  'state',
  'zip_code',
  'latitude',
  'longitude',
  'phone',
  'website',
  'contacts_json',
  'hours_text',
  'eligibility',
  'services_json',
  'tags_json',
  'search_text',
  'review_status',
  'review_note',
  'reviewed_at',
  'review_due_at',
  'availability_start',
  'availability_end',
  'active',
];
const RESOURCE_UPDATES = RESOURCE_COLUMNS
  .filter((column) => !['id', 'source_name', 'source_record_id'].includes(column))
  .map((column) => `${column}=excluded.${column}`)
  .join(',');

function getArgument(name) {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function sql(value) {
  if (value === undefined || value === null || value === '') return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function text(value) {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
  return normalized && normalized.toLowerCase() !== 'null' ? normalized : undefined;
}

function normalizedKey(value) {
  return text(value)?.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() ?? '';
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

function normalizeWebsite(value) {
  const raw = text(value);
  if (!raw || /^(?:javascript|data|mailto|tel):/i.test(raw)) return undefined;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    if (!url.hostname.includes('.') || /\s/.test(url.hostname)) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

function addDays(isoTimestamp, days) {
  return new Date(new Date(isoTimestamp).getTime() + days * 24 * 60 * 60 * 1_000).toISOString();
}

function strictCandidate(attributes) {
  const type = text(attributes.Type);
  const name = text(attributes.Name);
  const address = text(attributes.Address);
  const city = text(attributes.City);
  const state = text(attributes.State)?.toUpperCase();
  const zip = text(attributes.Zip_Code);
  const website = normalizeWebsite(attributes.Website);
  const latitude = Number(attributes.Latitude);
  const longitude = Number(attributes.Longitude);

  if (!DIRECT_TYPES.has(type)) return { reason: 'notDirectService' };
  if (!name || !address || !city || !state || !VALID_STATES.has(state)) {
    return { reason: 'invalidAddress' };
  }
  if (!zip || !/^\d{5}(?:-\d{4})?$/.test(zip)) return { reason: 'invalidZip' };
  if (!website) return { reason: 'missingUsableWebsite' };
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < 17 ||
    latitude > 72 ||
    longitude < -180 ||
    longitude > -64
  ) {
    return { reason: 'invalidCoordinates' };
  }
  if (/(?:^|\b)(?:test|sample)(?:\b|$)/i.test(name)) return { reason: 'explicitTestRecord' };

  return {
    value: {
      type,
      name,
      address,
      city,
      state,
      zipCode: zip.slice(0, 5),
      website,
      latitude,
      longitude,
    },
  };
}

export function normalizeEpaFoodFeature(feature, fetchedAt, sourceUpdatedAt) {
  const attributes = feature.attributes ?? {};
  const candidateResult = strictCandidate(attributes);
  if (!candidateResult.value) return candidateResult;

  const candidate = candidateResult.value;
  const isPantry = candidate.type === 'Food Pantry';
  const service = isPantry ? 'Food pantry groceries' : 'Prepared community meals';
  const typeLabel = isPantry ? 'food pantry' : 'soup kitchen';
  const sourceKey =
    text(attributes.UniqueID) ??
    [
      normalizedKey(candidate.name),
      normalizedKey(candidate.address),
      normalizedKey(candidate.city),
      candidate.state,
      candidate.zipCode,
      normalizedKey(candidate.type),
    ].join('|');
  const sourceRecordId = hash(sourceKey);
  const services = [
    service,
    isPantry ? 'Year-round food assistance' : 'Community meal service',
  ];
  const tags = [
    'food',
    'year-round food help',
    isPantry ? 'food pantry' : 'soup kitchen',
    isPantry ? 'groceries' : 'prepared meals',
  ];
  const contacts = [
    {
      type: 'website',
      label: `${candidate.name} website`,
      value: candidate.website,
      primary: true,
      note: 'Check current hours, eligibility, and instructions before traveling.',
    },
    {
      type: 'phone',
      label: 'USDA National Hunger Hotline',
      value: HUNGER_HOTLINE_PHONE,
      note: 'National referral line, Monday-Friday, 8 a.m.-8 p.m. Eastern.',
    },
  ];

  return {
    value: {
      id: `epa-food:${sourceRecordId}`,
      sourceName: SOURCE_NAME,
      sourceRecordId,
      sourceUrl: SOURCE_URL,
      sourceUpdatedAt,
      fetchedAt,
      name: candidate.name,
      category: 'food',
      description:
        `${candidate.name} is listed as a ${typeLabel} in EPA's national food-assistance layer, ` +
        'which republishes 2024 Hunger Free America directory data. Check the linked site before traveling.',
      address: candidate.address,
      city: candidate.city,
      state: candidate.state,
      zipCode: candidate.zipCode,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      phone: undefined,
      website: candidate.website,
      contactsJson: JSON.stringify(contacts),
      hoursText:
        'Hours are not included in this EPA snapshot. Check the linked site or contact the USDA National Hunger Hotline before traveling.',
      eligibility:
        'Requirements vary by location and may include residency, household, or registration rules. Check the linked site before visiting.',
      servicesJson: JSON.stringify(services),
      tagsJson: JSON.stringify(tags),
      searchText: [
        candidate.name,
        candidate.type,
        candidate.address,
        candidate.city,
        candidate.state,
        candidate.zipCode,
        ...services,
        ...tags,
      ].join(' ').toLowerCase(),
      reviewStatus: 'exception',
      reviewNote:
        'EPA republishes this 2024 Hunger Free America record for informational use and does not guarantee its accuracy or completeness. Hearth excluded records without a usable website but has not independently confirmed current hours, eligibility, or walk-in service.',
      reviewedAt: fetchedAt,
      reviewDueAt: addDays(fetchedAt, 90),
      availabilityStart: undefined,
      availabilityEnd: undefined,
      type: candidate.type,
    },
  };
}

async function jsonFetch(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  const payload = await response.json();
  if (payload?.error) {
    throw new Error(`ArcGIS error ${payload.error.code}: ${payload.error.message}`);
  }
  return payload;
}

async function arcgisQuery(parameters) {
  return jsonFetch(`${LAYER_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ ...parameters, f: 'json' }),
  });
}

async function fetchSource() {
  const definition = await jsonFetch(`${LAYER_URL}?f=json`);
  const requiredFields = [
    'OBJECTID',
    'Name',
    'Type',
    'Address',
    'City',
    'State',
    'Zip_Code',
    'Website',
    'UniqueID',
    'Latitude',
    'Longitude',
  ];
  const fieldNames = new Set(definition.fields?.map((field) => field.name));
  const missingFields = requiredFields.filter((field) => !fieldNames.has(field));
  if (missingFields.length) {
    throw new Error(`EPA layer schema changed; missing fields: ${missingFields.join(', ')}`);
  }
  if (definition.name !== 'Food Banks, Food Pantries and Soup Kitchens') {
    throw new Error(`EPA layer changed unexpectedly: ${definition.name}`);
  }

  const totalPublished = (
    await arcgisQuery({ where: '1=1', returnCountOnly: 'true' })
  ).count;
  const where = "Type IN ('Food Pantry','Soup Kitchen')";
  const candidateCount = (
    await arcgisQuery({ where, returnCountOnly: 'true' })
  ).count;
  const features = [];
  for (let offset = 0; offset < candidateCount; offset += PAGE_SIZE) {
    const page = await arcgisQuery({
      where,
      outFields: requiredFields.join(','),
      returnGeometry: 'false',
      orderByFields: 'OBJECTID',
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
    });
    features.push(...(page.features ?? []));
    if ((page.features?.length ?? 0) < PAGE_SIZE) break;
  }
  const lastEditDate = definition.editingInfo?.lastEditDate;
  return {
    features,
    totalPublished,
    candidateCount,
    layerName: definition.name,
    sourceUpdatedAt: Number.isFinite(lastEditDate)
      ? new Date(lastEditDate).toISOString()
      : undefined,
  };
}

function recordValues(record) {
  return [
    record.id,
    record.sourceName,
    record.sourceRecordId,
    record.sourceUrl,
    record.sourceUpdatedAt,
    record.fetchedAt,
    record.name,
    record.category,
    record.description,
    record.address,
    record.city,
    record.state,
    record.zipCode,
    record.latitude,
    record.longitude,
    record.phone,
    record.website,
    record.contactsJson,
    record.hoursText,
    record.eligibility,
    record.servicesJson,
    record.tagsJson,
    record.searchText,
    record.reviewStatus,
    record.reviewNote,
    record.reviewedAt,
    record.reviewDueAt,
    record.availabilityStart,
    record.availabilityEnd,
    1,
  ];
}

function insertStatement(records) {
  const values = records
    .map((record) => `(${recordValues(record).map(sql).join(',')})`)
    .join(',');
  return `INSERT INTO resources (${RESOURCE_COLUMNS.join(',')}) VALUES ${values} ON CONFLICT(source_name,source_record_id) DO UPDATE SET ${RESOURCE_UPDATES};\n`;
}

async function writeChunk(stream, chunk) {
  if (stream.write(chunk)) return;
  await new Promise((resolvePromise) => stream.once('drain', resolvePromise));
}

async function main() {
  const output = resolve(getArgument('output') ?? 'worker/data/epa-food-assistance.sql');
  const fetchedAt = getArgument('fetched-at') ?? new Date().toISOString();
  const source = await fetchSource();
  const records = new Map();
  const skippedByReason = {};
  let mergedDuplicates = 0;

  for (const feature of source.features) {
    const normalized = normalizeEpaFoodFeature(
      feature,
      fetchedAt,
      source.sourceUpdatedAt ?? fetchedAt
    );
    if (!normalized.value) {
      skippedByReason[normalized.reason] = (skippedByReason[normalized.reason] ?? 0) + 1;
      continue;
    }
    if (records.has(normalized.value.sourceRecordId)) {
      mergedDuplicates += 1;
      continue;
    }
    records.set(normalized.value.sourceRecordId, normalized.value);
  }

  const normalizedRecords = [...records.values()];
  const states = new Set(normalizedRecords.map((record) => record.state));
  const typeCounts = Object.fromEntries(
    [...DIRECT_TYPES].map((type) => [
      type,
      normalizedRecords.filter((record) => record.type === type).length,
    ])
  );

  await mkdir(dirname(output), { recursive: true });
  const destination = createWriteStream(output, { encoding: 'utf8' });
  const runId = `epa-food:${fetchedAt}`;
  await writeChunk(
    destination,
    `INSERT INTO import_runs (id,source_name,started_at,source_url,status) VALUES (${sql(runId)},${sql(SOURCE_NAME)},${sql(fetchedAt)},${sql(SOURCE_URL)},'running') ON CONFLICT(id) DO UPDATE SET started_at=excluded.started_at,completed_at=NULL,imported_count=0,skipped_count=0,status='running';\n`
  );
  for (let index = 0; index < normalizedRecords.length; index += BATCH_SIZE) {
    await writeChunk(
      destination,
      insertStatement(normalizedRecords.slice(index, index + BATCH_SIZE))
    );
  }
  await writeChunk(
    destination,
    `UPDATE resources SET active=0 WHERE source_name=${sql(SOURCE_NAME)} AND fetched_at<>${sql(fetchedAt)};\n`
  );
  await writeChunk(
    destination,
    `UPDATE import_runs SET completed_at=${sql(new Date().toISOString())},imported_count=${normalizedRecords.length},skipped_count=${Math.max(0, source.totalPublished - normalizedRecords.length)},status='completed' WHERE id=${sql(runId)};\n`
  );
  destination.end();
  await new Promise((resolvePromise, rejectPromise) => {
    destination.once('finish', resolvePromise);
    destination.once('error', rejectPromise);
  });

  console.log(
    JSON.stringify(
      {
        source: SOURCE_NAME,
        sourcePage: SOURCE_URL,
        layerUrl: LAYER_URL,
        layerName: source.layerName,
        output,
        fetchedAt,
        sourceUpdatedAt: source.sourceUpdatedAt,
        totalPublished: source.totalPublished,
        directServiceCandidates: source.candidateCount,
        fetchedCandidates: source.features.length,
        imported: normalizedRecords.length,
        skippedByReason,
        mergedDuplicates,
        stateCount: states.size,
        typeCounts,
        hotlinePage: HUNGER_HOTLINE_URL,
      },
      null,
      2
    )
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
