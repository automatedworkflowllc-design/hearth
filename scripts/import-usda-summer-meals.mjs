import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_NAME = 'USDA SUN Meals';
const SOURCE_URL = 'https://www.fns.usda.gov/summer/sitefinder';
const OFFICIAL_SHORT_URL = 'https://arcg.is/1Han113';
const PAGE_SIZE = 2_000;
const BATCH_SIZE = 25;
const VALID_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA',
  'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS',
  'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA',
  'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY',
]);
const MEAL_FIELDS = [
  ['Breakfast_Time2', 'Breakfast'],
  ['Lunch_Time2', 'Lunch'],
  ['Snack_Time_AM2', 'Morning snack'],
  ['Snack_Time_PM2', 'Afternoon snack'],
  ['Dinner_Supper_Time2', 'Dinner'],
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

function isoDate(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? new Date(value) : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function cleanPhone(value, extension) {
  const phone = text(value);
  if (!phone) return undefined;
  const ext = text(extension);
  return ext ? `${phone} x${ext}` : phone;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function formatDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function daysOfOperation(value) {
  const raw = text(value);
  if (!raw) return undefined;
  const names = new Map([
    ['M', 'Mon'],
    ['MON', 'Mon'],
    ['T', 'Tue'],
    ['TU', 'Tue'],
    ['TUE', 'Tue'],
    ['W', 'Wed'],
    ['WED', 'Wed'],
    ['TH', 'Thu'],
    ['THU', 'Thu'],
    ['F', 'Fri'],
    ['FRI', 'Fri'],
    ['S', 'Sat'],
    ['SA', 'Sat'],
    ['SAT', 'Sat'],
    ['SU', 'Sun'],
    ['SUN', 'Sun'],
  ]);
  const parsed = raw
    .split(/[,;/|]+/)
    .map((part) => names.get(part.trim().toUpperCase()) ?? part.trim())
    .filter(Boolean);
  return unique(parsed).join(', ') || raw;
}

function mealSchedule(attributes) {
  return MEAL_FIELDS.flatMap(([field, label]) => {
    const time = text(attributes[field]);
    return time ? [{ label, time }] : [];
  });
}

function strictCandidate(attributes, geometry, season) {
  const start = isoDate(attributes.Start_date);
  const end = isoDate(attributes.End_date);
  const name = text(attributes.Site_Name);
  const address = text(attributes.Site_Address1);
  const city = text(attributes.Site_City);
  const state = text(attributes.Site_State)?.toUpperCase();
  const zip = text(attributes.Site_Zip);
  const latitude = Number(geometry?.y);
  const longitude = Number(geometry?.x);
  const explicitTestMarker = [
    attributes.Site_Address2,
    attributes.Comments,
    attributes.Site_Name,
  ].some((value) => /(?:staggs\s+test|test\s+cycle)/i.test(String(value ?? '')));

  if (text(attributes.Season) !== season) return { reason: 'wrongSeason' };
  if (text(attributes.Dropped)?.toLowerCase() !== 'false') return { reason: 'dropped' };
  if (text(attributes.Expired)?.toLowerCase() !== 'false') return { reason: 'expired' };
  if (!['OPEN', 'OPEN RESTRICTED'].includes(text(attributes.Site_Type)?.toUpperCase())) {
    return { reason: 'unsupportedSiteType' };
  }
  if (
    !['CONGREGATE', 'NON-CONGREGATE PICK UP'].includes(
      text(attributes.Service_Model)?.toUpperCase()
    )
  ) {
    return { reason: 'unsupportedServiceModel' };
  }
  if (!['SFSP', 'SSO'].includes(text(attributes.Site_Program)?.toUpperCase())) {
    return { reason: 'unsupportedProgram' };
  }
  if (!start || !end || end < start) return { reason: 'invalidDates' };
  if (!name || !address || !city || !state || !VALID_STATES.has(state)) {
    return { reason: 'invalidAddress' };
  }
  if (!zip || !/^\d{5}(?:-\d{4})?$/.test(zip)) return { reason: 'invalidZip' };
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { reason: 'invalidCoordinates' };
  }
  if (!mealSchedule(attributes).length) return { reason: 'missingMealSchedule' };
  if (explicitTestMarker) return { reason: 'explicitTestRecord' };
  return {
    value: {
      attributes,
      name,
      address,
      city,
      state,
      zipCode: zip.slice(0, 5),
      latitude,
      longitude,
      start,
      end,
    },
  };
}

function dedupeKey(candidate) {
  const a = candidate.attributes;
  return [
    normalizedKey(candidate.name),
    normalizedKey(candidate.address),
    normalizedKey(a.Site_Address2),
    normalizedKey(candidate.city),
    candidate.state,
    candidate.zipCode,
    candidate.start,
    candidate.end,
    normalizedKey(a.Days_of_operation),
    ...MEAL_FIELDS.map(([field]) => normalizedKey(a[field])),
    normalizedKey(a.Service_Model),
  ].join('|');
}

function reviewDueAt(fetchedAt, endDate) {
  const weeklyReview = new Date(new Date(fetchedAt).getTime() + 7 * 24 * 60 * 60 * 1_000);
  const seasonEnd = new Date(`${endDate}T23:59:59.999Z`);
  return new Date(Math.min(weeklyReview.getTime(), seasonEnd.getTime())).toISOString();
}

export function normalizeSummerMealFeature(feature, fetchedAt, sourceUpdatedAt, season) {
  const candidateResult = strictCandidate(feature.attributes ?? {}, feature.geometry, season);
  if (!candidateResult.value) return candidateResult;

  const candidate = candidateResult.value;
  const attributes = candidate.attributes;
  const schedule = mealSchedule(attributes);
  const serviceModel = text(attributes.Service_Model)?.toUpperCase();
  const siteType = text(attributes.Site_Type)?.toUpperCase();
  const siteLocation = text(attributes.Site_Location);
  const sponsor = text(attributes.Sponsoring_Organization);
  const address2 = text(attributes.Site_Address2);
  const address = unique([candidate.address, address2]).join(', ');
  const sitePhone = cleanPhone(attributes.Site_Phone, attributes.Ext);
  const contactPhone = cleanPhone(attributes.Contact_Phone);
  const contactCandidates = [
    sitePhone
      ? { type: 'phone', label: 'Meal site phone', value: sitePhone, primary: true }
      : undefined,
    contactPhone
      ? {
          type: 'phone',
          label: 'Program contact',
          value: contactPhone,
          primary: !sitePhone || undefined,
        }
      : undefined,
  ].filter(Boolean);
  const seenPhones = new Set();
  const contacts = contactCandidates
    .filter((contact) => {
      const key = normalizedKey(contact.value);
      if (seenPhones.has(key)) return false;
      seenPhones.add(key);
      return true;
    })
    .map((contact) => ({
      ...contact,
      note: 'Call to confirm today’s meal times and any site restrictions.',
    }));
  const services = schedule.map(({ label }) => `Free summer ${label.toLowerCase()}`);
  if (serviceModel === 'NON-CONGREGATE PICK UP') services.push('SUN Meals To-Go pickup');
  const tags = unique([
    'food',
    'free meals',
    'summer meals',
    'children 18 and under',
    serviceModel === 'NON-CONGREGATE PICK UP' ? 'meals to-go' : 'eat on-site',
    siteType === 'OPEN RESTRICTED' ? 'restricted open site' : 'open meal site',
    siteLocation?.toLowerCase() === 'mobile' ? 'mobile meal site' : undefined,
    ...schedule.map(({ label }) => label.toLowerCase()),
  ]);
  const days = daysOfOperation(attributes.Days_of_operation);
  const mealTimes = schedule.map(({ label, time }) => `${label}: ${time}`).join('; ');
  const sourceRecordId = hash(dedupeKey(candidate));
  const restrictionNote =
    siteType === 'OPEN RESTRICTED'
      ? ' This restricted-open site may limit attendance for space, safety, security, or control; call before visiting.'
      : '';
  const mobileNote =
    siteLocation?.toLowerCase() === 'mobile'
      ? ' This is listed as a mobile meal site; call to confirm the exact stop.'
      : '';

  return {
    value: {
      id: `usda-sun-meals:${sourceRecordId}`,
      sourceName: SOURCE_NAME,
      sourceRecordId,
      sourceUrl: SOURCE_URL,
      sourceUpdatedAt,
      fetchedAt,
      name: candidate.name,
      category: 'food',
      description:
        `${candidate.name} is a state-submitted USDA summer meal site offering free meals or snacks to children age 18 and under during its listed operating season.` +
        restrictionNote +
        mobileNote,
      address,
      city: candidate.city,
      state: candidate.state,
      zipCode: candidate.zipCode,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      phone: sitePhone ?? contactPhone,
      website: SOURCE_URL,
      contactsJson: JSON.stringify(contacts),
      hoursText: [
        `Season: ${formatDate(candidate.start)}–${formatDate(candidate.end)}.`,
        days ? `Days: ${days}.` : undefined,
        `Meal times: ${mealTimes}.`,
      ]
        .filter(Boolean)
        .join(' '),
      eligibility:
        siteType === 'OPEN RESTRICTED'
          ? 'Free for children age 18 and under. Attendance may be limited for space, safety, security, or control; call before visiting.'
          : 'Free for children age 18 and under. No application is needed at open sites; meals are first come, first served.',
      servicesJson: JSON.stringify(unique(services)),
      tagsJson: JSON.stringify(tags),
      searchText: [
        candidate.name,
        sponsor,
        address,
        candidate.city,
        candidate.state,
        candidate.zipCode,
        ...services,
        ...tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      reviewStatus: 'exception',
      reviewNote:
        'State agencies submit these seasonal sites to USDA and update them during summer. Hearth uses the published operating dates, days, and meal times but has not independently confirmed today’s service. Call before traveling.',
      reviewedAt: fetchedAt,
      reviewDueAt: reviewDueAt(fetchedAt, candidate.end),
      availabilityStart: candidate.start,
      availabilityEnd: candidate.end,
      serviceModel,
      siteType,
      sponsor,
    },
  };
}

function allStrings(value, output = []) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => allStrings(item, output));
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => allStrings(item, output));
  }
  return output;
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

export async function resolveOfficialSummerMealsLayer(shortUrl = OFFICIAL_SHORT_URL) {
  const redirect = await fetch(shortUrl, { redirect: 'follow' });
  if (!redirect.ok) throw new Error(`HTTP ${redirect.status} resolving ${shortUrl}`);
  const itemId = /\/experience\/([a-f0-9]{32})/i.exec(redirect.url)?.[1];
  if (!itemId) throw new Error(`USDA short link resolved to an unexpected URL: ${redirect.url}`);

  const itemBase = `https://www.arcgis.com/sharing/rest/content/items/${itemId}`;
  const [metadata, appData] = await Promise.all([
    jsonFetch(`${itemBase}?f=json`),
    jsonFetch(`${itemBase}/data?f=json`),
  ]);
  const layerUrls = allStrings(appData).filter(
    (value) =>
      /^https:\/\/services\d*\.arcgis\.com\//i.test(value) &&
      /Summer_Meals_Site_Finder_\d{4}/i.test(value) &&
      /\/FeatureServer\/0\/?$/i.test(value)
  );
  const layerUrl = unique(layerUrls)[0];
  if (!layerUrl) throw new Error('The official USDA app did not expose a current meal-site layer.');
  if (metadata.access !== 'public') throw new Error('The official USDA ArcGIS app is no longer public.');
  return {
    itemId,
    itemTitle: metadata.title,
    itemOwner: metadata.owner,
    itemUrl: redirect.url,
    layerUrl: layerUrl.replace(/\/$/, ''),
    sourceUpdatedAt: new Date(metadata.modified).toISOString(),
  };
}

async function arcgisQuery(layerUrl, parameters) {
  return jsonFetch(`${layerUrl}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ ...parameters, f: 'json' }),
  });
}

async function fetchFeatures(layerUrl, season) {
  const requiredFields = [
    'Site_Name',
    'Site_Type',
    'Service_Model',
    'Site_Address1',
    'Site_Address2',
    'Site_City',
    'Site_State',
    'Site_Zip',
    'Site_Phone',
    'Ext',
    'Contact_Phone',
    'Sponsoring_Organization',
    'Start_date',
    'End_date',
    'Days_of_operation',
    'Comments',
    'Site_Location',
    'Site_Program',
    'Season',
    'Dropped',
    'Expired',
    ...MEAL_FIELDS.map(([field]) => field),
    'FID',
    'GlobalID',
  ];
  const definition = await jsonFetch(`${layerUrl}?f=json`);
  const fieldNames = new Set(definition.fields?.map((field) => field.name));
  const missingFields = requiredFields.filter((field) => !fieldNames.has(field));
  if (missingFields.length) {
    throw new Error(`USDA layer schema changed; missing fields: ${missingFields.join(', ')}`);
  }

  const totalPublished = (
    await arcgisQuery(layerUrl, { where: '1=1', returnCountOnly: 'true' })
  ).count;
  const where = [
    `Season='${season}'`,
    "Dropped='False'",
    "Expired='False'",
    'Start_date IS NOT NULL',
    'End_date IS NOT NULL',
    "Site_Type IN ('OPEN','OPEN RESTRICTED')",
    "Service_Model IN ('CONGREGATE','NON-CONGREGATE PICK UP')",
    "Site_Program IN ('SFSP','SSO')",
  ].join(' AND ');
  const candidateCount = (
    await arcgisQuery(layerUrl, { where, returnCountOnly: 'true' })
  ).count;
  const features = [];
  for (let offset = 0; offset < candidateCount; offset += PAGE_SIZE) {
    const page = await arcgisQuery(layerUrl, {
      where,
      outFields: requiredFields.join(','),
      returnGeometry: 'true',
      outSR: '4326',
      orderByFields: 'FID',
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
    });
    features.push(...(page.features ?? []));
    if ((page.features?.length ?? 0) < PAGE_SIZE) break;
  }
  return { features, totalPublished, candidateCount };
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
  const output = resolve(getArgument('output') ?? 'worker/data/usda-summer-meals.sql');
  const fetchedAt = getArgument('fetched-at') ?? new Date().toISOString();
  const asOf = getArgument('as-of') ?? fetchedAt.slice(0, 10);
  const season = getArgument('season') ?? asOf.slice(0, 4);
  const explicitLayerUrl = getArgument('layer-url');
  const resolvedSource = explicitLayerUrl
    ? {
        itemId: undefined,
        itemTitle: 'Explicit layer override',
        itemOwner: undefined,
        itemUrl: undefined,
        layerUrl: explicitLayerUrl.replace(/\/$/, ''),
        sourceUpdatedAt: getArgument('source-updated-at') ?? fetchedAt,
      }
    : await resolveOfficialSummerMealsLayer();

  const { features, totalPublished, candidateCount } = await fetchFeatures(
    resolvedSource.layerUrl,
    season
  );
  const records = new Map();
  const skippedByReason = {};
  let mergedDuplicates = 0;
  for (const feature of features) {
    const normalized = normalizeSummerMealFeature(
      feature,
      fetchedAt,
      resolvedSource.sourceUpdatedAt,
      season
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
  const activeOnAsOf = normalizedRecords.filter(
    (record) => record.availabilityStart <= asOf && record.availabilityEnd >= asOf
  ).length;
  const states = new Set(normalizedRecords.map((record) => record.state));
  const outputDirectory = dirname(output);
  await mkdir(outputDirectory, { recursive: true });
  const destination = createWriteStream(output, { encoding: 'utf8' });
  const runId = `usda-sun-meals:${fetchedAt}`;
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
  // Shrink guard -- see import-samhsa.mjs for the full rationale. Sweep only runs
  // when the new import is >=75% of the prior active set; otherwise prior records
  // stay ACTIVE and the run is marked 'shrink_blocked' so /health alarms.
  // NOTE: this source legitimately collapses at season end -- run that final
  // import with ALLOW_SHRINK=1.
  const priorActive = `(SELECT COUNT(*) FROM resources WHERE source_name=${sql(SOURCE_NAME)} AND active=1 AND fetched_at<>${sql(fetchedAt)})`;
  const newlyImported = `(SELECT COUNT(*) FROM resources WHERE source_name=${sql(SOURCE_NAME)} AND fetched_at=${sql(fetchedAt)})`;
  await writeChunk(
    destination,
    process.env.ALLOW_SHRINK === '1'
      ? `UPDATE resources SET active=0 WHERE source_name=${sql(SOURCE_NAME)} AND fetched_at<>${sql(fetchedAt)};\n`
      : `UPDATE resources SET active=0 WHERE source_name=${sql(SOURCE_NAME)} AND fetched_at<>${sql(fetchedAt)} AND ${priorActive} * 3 <= ${newlyImported} * 4;\n`
  );
  await writeChunk(
    destination,
    `UPDATE import_runs SET completed_at=${sql(new Date().toISOString())},imported_count=${normalizedRecords.length},skipped_count=${Math.max(0, totalPublished - normalizedRecords.length)},status=CASE WHEN ${priorActive} > 0 THEN 'shrink_blocked' ELSE 'completed' END WHERE id=${sql(runId)};\n`
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
        ...resolvedSource,
        output,
        fetchedAt,
        asOf,
        season,
        totalPublished,
        candidateCount,
        fetchedCandidates: features.length,
        imported: normalizedRecords.length,
        activeOnAsOf,
        inactiveOutsideDateWindow: normalizedRecords.length - activeOnAsOf,
        skippedByReason,
        mergedDuplicates,
        stateCount: states.size,
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
