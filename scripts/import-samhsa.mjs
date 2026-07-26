import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readXlsxSheets, rowsToObjects } from './xlsx-reader.mjs';

const SOURCE_NAME = 'SAMHSA';
const SOURCE_URL =
  'https://www.samhsa.gov/data/data-we-collect/n-sumhss-national-substance-use-and-mental-health-services-survey/national-directories';
const SOURCE_UPDATED_AT = '2026-03-06T00:00:00.000Z';
const BATCH_SIZE = 25;
const DISPLAY_SERVICE_CATEGORIES = [
  'Type of Care',
  'Service Setting',
  'Facility Type',
  'Detoxification (medical withdrawal) Services',
  'Treatment Approaches',
  'Emergency Mental Health Services',
  'Recovery Support Services',
  'Ancillary Services',
];
const TAG_RULES = [
  [/outpatient/i, 'outpatient'],
  [/residential/i, 'residential treatment'],
  [/hospital inpatient/i, 'hospital inpatient'],
  [/detox/i, 'detoxification'],
  [/telemed|telehealth/i, 'telehealth'],
  [/opioid treatment program/i, 'opioid treatment program'],
  [/payment assistance|sliding fee/i, 'payment assistance'],
  [/veteran/i, 'veterans'],
  [/adolesc|children|young adult/i, 'youth services'],
  [/senior|older adult/i, 'older adults'],
  [/co-occurring/i, 'co-occurring treatment'],
  [/suicide/i, 'suicide prevention'],
];
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

function normalizedKeyPart(value) {
  return (
    text(value)
      ?.normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim() ?? ''
  );
}

function zipCode(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 4) return digits.padStart(5, '0');
  return digits.length >= 5 ? digits.slice(0, 5) : undefined;
}

function phoneKey(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function facilityKey(row) {
  return [
    row.name1,
    row.name2,
    row.street1,
    row.street2,
    row.city,
    row.state,
    zipCode(row.zip),
  ]
    .map(normalizedKeyPart)
    .join('|');
}

function sourceRecordId(key) {
  return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

function buildCodebook(referenceRows) {
  const codebook = new Map();
  for (const row of referenceRows) {
    const code = text(row.service_code);
    const serviceName = text(row.service_name);
    const categoryName = text(row.category_name);
    if (!code || !serviceName || !categoryName || codebook.has(code)) continue;
    codebook.set(code, { categoryName, serviceName });
  }
  return codebook;
}

function serviceCodes(value) {
  return unique(
    String(value ?? '')
      .split(/\s+/)
      .map((code) => code.trim())
      .filter((code) => code && code !== '*')
  );
}

function contactMethods(row) {
  const candidates = [
    { type: 'phone', label: 'Main phone', value: text(row.phone), primary: true },
    { type: 'intake', label: 'Intake line', value: text(row.intake1) },
    { type: 'intake', label: 'Intake line 2', value: text(row.intake2) },
    { type: 'intake', label: 'Alternate intake line', value: text(row.intake1a) },
    { type: 'intake', label: 'Alternate intake line 2', value: text(row.intake2a) },
  ];
  const seen = new Set();
  return candidates.filter((contact) => {
    const key = phoneKey(contact.value);
    if (!contact.value || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeContacts(target, additions) {
  const seen = new Set(target.map((contact) => phoneKey(contact.value)));
  for (const contact of additions) {
    const key = phoneKey(contact.value);
    if (!key || seen.has(key)) continue;
    target.push(contact);
    seen.add(key);
  }
}

function directoryFacility(row, kind) {
  const key = facilityKey(row);
  const name1 = text(row.name1);
  const city = text(row.city);
  const state = text(row.state)?.toUpperCase();
  const postalCode = zipCode(row.zip);
  const street1 = text(row.street1);
  if (!key || !name1 || !street1 || !city || !state || !postalCode) return undefined;

  return {
    key,
    name1,
    name2: text(row.name2),
    address: [street1, text(row.street2)].filter(Boolean).join(', '),
    city,
    state,
    zipCode: postalCode,
    directoryKinds: new Set([kind]),
    serviceCodes: new Set(serviceCodes(row.service_code_info)),
    contacts: contactMethods(row),
  };
}

function mergeFacility(target, source) {
  for (const kind of source.directoryKinds) target.directoryKinds.add(kind);
  for (const code of source.serviceCodes) target.serviceCodes.add(code);
  mergeContacts(target.contacts, source.contacts);
  if (!target.name2 && source.name2) target.name2 = source.name2;
}

function decodedServices(facility, codebook) {
  return [...facility.serviceCodes]
    .map((code) => ({ code, ...codebook.get(code) }))
    .filter((service) => service.categoryName && service.serviceName);
}

function displayedServices(services) {
  const rank = new Map(DISPLAY_SERVICE_CATEGORIES.map((name, index) => [name, index]));
  return unique(
    services
      .filter((service) => rank.has(service.categoryName))
      .sort(
        (left, right) =>
          rank.get(left.categoryName) - rank.get(right.categoryName) ||
          left.serviceName.localeCompare(right.serviceName)
      )
      .map((service) => service.serviceName)
  ).slice(0, 14);
}

function searchableServiceNames(services) {
  return unique(services.map((service) => service.serviceName)).slice(0, 32);
}

function serviceTags(services) {
  const names = services.map((service) => service.serviceName);
  const tags = [];
  for (const [pattern, tag] of TAG_RULES) {
    if (names.some((name) => pattern.test(name))) tags.push(tag);
  }
  return tags;
}

function normalizedRecord(facility, codebook, fetchedAt, sourceUpdatedAt) {
  const decoded = decodedServices(facility, codebook);
  const kinds = [...facility.directoryKinds];
  const services = displayedServices(decoded);
  const name = facility.name2
    ? `${facility.name1} - ${facility.name2}`
    : facility.name1;
  const kindTags = kinds.map((kind) =>
    kind === 'mental-health' ? 'mental health' : 'substance use treatment'
  );
  const tags = unique([
    'health',
    'behavioral health',
    ...kindTags,
    ...serviceTags(decoded),
  ]);
  const primaryPhone = facility.contacts.find((contact) => contact.type === 'phone')?.value;
  const id = sourceRecordId(facility.key);

  return {
    id: `samhsa:${id}`,
    sourceName: SOURCE_NAME,
    sourceRecordId: id,
    sourceUrl: SOURCE_URL,
    sourceUpdatedAt,
    fetchedAt,
    name,
    category: 'health',
    description:
      `${name} appears in SAMHSA's 2025 National Directories of behavioral-health treatment facilities.` +
      ' The listing is based on the facility-reported 2024 N-SUMHSS; call to confirm current services, costs, eligibility, and intake requirements.',
    address: facility.address,
    city: facility.city,
    state: facility.state,
    zipCode: facility.zipCode,
    latitude: undefined,
    longitude: undefined,
    phone: primaryPhone,
    website: undefined,
    contactsJson: JSON.stringify(facility.contacts),
    hoursText: 'Call to confirm current hours and intake availability.',
    eligibility: 'Contact the facility to confirm eligibility, payment options, and intake requirements.',
    servicesJson: JSON.stringify(services),
    tagsJson: JSON.stringify(tags),
    searchText: [
      name,
      facility.address,
      facility.city,
      facility.state,
      facility.zipCode,
      ...tags,
      ...searchableServiceNames(decoded),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
    reviewStatus: 'exception',
    reviewNote:
      "Imported from SAMHSA's 2025 National Directories, published March 6, 2026. Details are facility-reported and may change. Map distance uses the facility ZIP centroid and is approximate; call before traveling.",
    reviewedAt: fetchedAt,
    reviewDueAt: fetchedAt,
  };
}

export function normalizeSamhsaDirectories(
  { substanceUseRows, mentalHealthRows, referenceRows },
  fetchedAt,
  sourceUpdatedAt = SOURCE_UPDATED_AT
) {
  const codebook = buildCodebook(referenceRows);
  const facilities = new Map();
  let skipped = 0;
  let sourceRows = 0;
  let mergedDuplicates = 0;
  let withoutPublicAddress = 0;

  for (const [kind, rows] of [
    ['substance-use', substanceUseRows],
    ['mental-health', mentalHealthRows],
  ]) {
    for (const row of rows) {
      sourceRows += 1;
      const facility = directoryFacility(row, kind);
      if (!facility) {
        if (!text(row.street1)) withoutPublicAddress += 1;
        skipped += 1;
        continue;
      }
      const existing = facilities.get(facility.key);
      if (existing) {
        mergeFacility(existing, facility);
        mergedDuplicates += 1;
      } else {
        facilities.set(facility.key, facility);
      }
    }
  }

  const records = [...facilities.values()].map((facility) =>
    normalizedRecord(facility, codebook, fetchedAt, sourceUpdatedAt)
  );
  const knownCodes = new Set(codebook.keys());
  const unknownServiceCodes = unique(
    [...facilities.values()].flatMap((facility) =>
      [...facility.serviceCodes].filter((code) => !knownCodes.has(code))
    )
  ).sort();

  return {
    records,
    stats: {
      sourceRows,
      imported: records.length,
      skipped,
      withoutPublicAddress,
      mergedDuplicates,
      withoutPhone: records.filter((record) => !record.phone).length,
      unknownServiceCodes,
    },
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

async function readDirectory(path) {
  const sheets = await readXlsxSheets(resolve(path), [
    'Facilities List',
    'Service Code Reference',
  ]);
  return {
    facilities: rowsToObjects(sheets.get('Facilities List')),
    references: rowsToObjects(sheets.get('Service Code Reference')),
  };
}

async function main() {
  const substanceUseInput = getArgument('substance-use');
  const mentalHealthInput = getArgument('mental-health');
  if (!substanceUseInput || !mentalHealthInput) {
    throw new Error(
      'Usage: npm run directory:ingest:samhsa -- --substance-use=/path/to/su.xlsx --mental-health=/path/to/mh.xlsx [--output=worker/data/samhsa.sql]'
    );
  }

  const output = resolve(getArgument('output') ?? 'worker/data/samhsa.sql');
  const fetchedAt = getArgument('fetched-at') ?? new Date().toISOString();
  const sourceUpdatedAt = getArgument('source-updated-at') ?? SOURCE_UPDATED_AT;
  const [substanceUse, mentalHealth] = await Promise.all([
    readDirectory(substanceUseInput),
    readDirectory(mentalHealthInput),
  ]);
  const { records, stats } = normalizeSamhsaDirectories(
    {
      substanceUseRows: substanceUse.facilities,
      mentalHealthRows: mentalHealth.facilities,
      referenceRows: [...substanceUse.references, ...mentalHealth.references],
    },
    fetchedAt,
    sourceUpdatedAt
  );

  await mkdir(dirname(output), { recursive: true });
  const destination = createWriteStream(output, { encoding: 'utf8' });
  const runId = `samhsa:${fetchedAt}`;
  await writeChunk(
    destination,
    `INSERT INTO import_runs (id,source_name,started_at,source_url,status) VALUES (${sql(runId)},${sql(SOURCE_NAME)},${sql(fetchedAt)},${sql(SOURCE_URL)},'running') ON CONFLICT(id) DO UPDATE SET started_at=excluded.started_at,completed_at=NULL,imported_count=0,skipped_count=0,status='running';\n`
  );

  for (let index = 0; index < records.length; index += BATCH_SIZE) {
    await writeChunk(destination, insertStatement(records.slice(index, index + BATCH_SIZE)));
  }
  await writeChunk(
    destination,
    `UPDATE resources SET latitude=(SELECT latitude FROM zip_centroids WHERE zip_code=resources.zip_code),longitude=(SELECT longitude FROM zip_centroids WHERE zip_code=resources.zip_code) WHERE source_name=${sql(SOURCE_NAME)} AND fetched_at=${sql(fetchedAt)};\n`
  );
  await writeChunk(
    destination,
    `UPDATE resources SET active=0 WHERE source_name=${sql(SOURCE_NAME)} AND fetched_at<>${sql(fetchedAt)};\n`
  );
  await writeChunk(
    destination,
    `UPDATE import_runs SET completed_at=${sql(new Date().toISOString())},imported_count=${records.length},skipped_count=${stats.skipped},status='completed' WHERE id=${sql(runId)};\n`
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
        substanceUseInput: resolve(substanceUseInput),
        mentalHealthInput: resolve(mentalHealthInput),
        output,
        fetchedAt,
        sourceUpdatedAt,
        ...stats,
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
