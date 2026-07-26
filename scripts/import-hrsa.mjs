import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse';

const SOURCE_NAME = 'HRSA';
const SOURCE_URL = 'https://data.hrsa.gov/topics/health-centers';
const BATCH_SIZE = 50;
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
  'active',
];
const RESOURCE_UPDATES = RESOURCE_COLUMNS
  .filter((column) => !['id', 'source_name', 'source_record_id'].includes(column))
  .map((column) => `${column}=excluded.${column}`)
  .join(',');

function getArgument(name) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((argument) => argument.startsWith(prefix));
  return match?.slice(prefix.length);
}

function sql(value) {
  if (value === undefined || value === null || value === '') return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function text(value) {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
  return normalized || undefined;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function website(value) {
  const normalized = text(value);
  if (!normalized) return undefined;
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
}

function sourceRecordId(row) {
  const healthCenter = text(row['Health Center Number']);
  const location = text(row['Health Center Location Identification Number']);
  const assigned = text(row['BPHC Assigned Number']);
  return [healthCenter, location, assigned].filter(Boolean).join(':');
}

export function normalizeHrsaRow(row, fetchedAt) {
  if (text(row['Site Status Description'])?.toLowerCase() !== 'active') return undefined;

  const sourceId = sourceRecordId(row);
  const name = text(row['Site Name']);
  const city = text(row['Site City']);
  const state = text(row['Site State Abbreviation']);
  if (!sourceId || !name || !city || !state) return undefined;

  const address = text(row['Site Address']);
  const zipCode = text(row['Site Postal Code'])?.slice(0, 5);
  const hoursPerWeek = number(row['Operating Hours per Week']);
  const healthCenterType = text(row['Health Center Type']);
  const organization = text(row['Health Center Name']);
  const services = ['Primary health care'];
  const tags = [
    'health',
    'community health center',
    'federally qualified health center',
    healthCenterType,
  ].filter(Boolean);
  const description =
    `${name} is an active health-center service site listed by the U.S. Health Resources and Services Administration.` +
    ' Call the site to confirm available services, costs, eligibility, and appointment requirements.';
  const phone = text(row['Site Telephone Number']);
  const officialWebsite = website(row['Site Web Address']);
  const contacts = [
    phone
      ? {
          type: 'phone',
          label: 'Main phone',
          value: phone,
          primary: true,
          note: 'Call to confirm services, eligibility, and current hours.',
        }
      : undefined,
    officialWebsite
      ? {
          type: 'website',
          label: 'Official website',
          value: officialWebsite,
        }
      : undefined,
  ].filter(Boolean);

  return {
    id: `hrsa:${sourceId}`,
    sourceName: SOURCE_NAME,
    sourceRecordId: sourceId,
    sourceUrl: SOURCE_URL,
    sourceUpdatedAt: fetchedAt,
    fetchedAt,
    name,
    category: 'health',
    description,
    address,
    city,
    state,
    zipCode,
    latitude: number(row['Geocoding Artifact Address Primary Y Coordinate']),
    longitude: number(row['Geocoding Artifact Address Primary X Coordinate']),
    phone,
    website: officialWebsite,
    contactsJson: JSON.stringify(contacts),
    hoursText: hoursPerWeek
      ? `${hoursPerWeek} operating hours per week; call for the current daily schedule.`
      : 'Call to confirm current hours.',
    eligibility: 'Contact the health center to confirm services, eligibility, and sliding-fee options.',
    servicesJson: JSON.stringify(services),
    tagsJson: JSON.stringify(tags),
    searchText: [
      name,
      organization,
      address,
      city,
      state,
      zipCode,
      healthCenterType,
      ...tags,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
    reviewStatus: 'exception',
    reviewNote:
      'Imported from HRSA’s daily national dataset. Hearth has not independently confirmed this site’s current services or hours.',
    reviewedAt: fetchedAt,
    reviewDueAt: fetchedAt,
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
  const input = getArgument('input');
  if (!input) {
    throw new Error(
      'Usage: npm run directory:ingest:hrsa -- --input=/path/to/hrsa.csv [--output=worker/data/hrsa.sql]'
    );
  }

  const output = resolve(getArgument('output') ?? 'worker/data/hrsa.sql');
  const fetchedAt = getArgument('fetched-at') ?? new Date().toISOString();
  await mkdir(dirname(output), { recursive: true });

  const destination = createWriteStream(output, { encoding: 'utf8' });
  const runId = `hrsa:${fetchedAt}`;
  await writeChunk(
    destination,
    `INSERT INTO import_runs (id,source_name,started_at,source_url,status) VALUES (${sql(runId)},${sql(SOURCE_NAME)},${sql(fetchedAt)},${sql(SOURCE_URL)},'running') ON CONFLICT(id) DO UPDATE SET started_at=excluded.started_at,completed_at=NULL,imported_count=0,skipped_count=0,status='running';\n`
  );

  let imported = 0;
  let skipped = 0;
  const seen = new Set();
  let batch = [];
  const parser = createReadStream(resolve(input)).pipe(
    parse({
      bom: true,
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  for await (const row of parser) {
    const record = normalizeHrsaRow(row, fetchedAt);
    if (!record || seen.has(record.sourceRecordId)) {
      skipped += 1;
      continue;
    }
    seen.add(record.sourceRecordId);
    imported += 1;
    batch.push(record);
    if (batch.length >= BATCH_SIZE) {
      await writeChunk(destination, insertStatement(batch));
      batch = [];
    }
  }
  if (batch.length) await writeChunk(destination, insertStatement(batch));

  await writeChunk(
    destination,
    `UPDATE resources SET active=0 WHERE source_name=${sql(SOURCE_NAME)} AND fetched_at<>${sql(fetchedAt)};\n`
  );
  await writeChunk(
    destination,
    `UPDATE import_runs SET completed_at=${sql(new Date().toISOString())},imported_count=${imported},skipped_count=${skipped},status='completed' WHERE id=${sql(runId)};\n`
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
        input: resolve(input),
        output,
        fetchedAt,
        imported,
        skipped,
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
