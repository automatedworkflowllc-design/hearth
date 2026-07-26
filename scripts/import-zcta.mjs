import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse';

const SOURCE_NAME = 'U.S. Census Bureau 2025 Gazetteer';
const SOURCE_URL =
  'https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.2025.html';
const BATCH_SIZE = 500;

function getArgument(name) {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function sql(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function writeChunk(stream, chunk) {
  if (stream.write(chunk)) return;
  await new Promise((resolvePromise) => stream.once('drain', resolvePromise));
}

function insertStatement(records) {
  const values = records
    .map(
      ({ zipCode, latitude, longitude, fetchedAt }) =>
        `(${sql(zipCode)},${sql(latitude)},${sql(longitude)},${sql(SOURCE_NAME)},2025,${sql(fetchedAt)})`
    )
    .join(',');
  return `INSERT INTO zip_centroids (zip_code,latitude,longitude,source_name,source_year,fetched_at) VALUES ${values} ON CONFLICT(zip_code) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,source_name=excluded.source_name,source_year=excluded.source_year,fetched_at=excluded.fetched_at;\n`;
}

async function main() {
  const input = getArgument('input');
  if (!input) {
    throw new Error(
      'Usage: npm run directory:ingest:zcta -- --input=/path/to/2025_Gaz_zcta_national.txt [--output=worker/data/zcta.sql]'
    );
  }

  const output = resolve(getArgument('output') ?? 'worker/data/zcta.sql');
  const fetchedAt = getArgument('fetched-at') ?? new Date().toISOString();
  await mkdir(dirname(output), { recursive: true });

  const destination = createWriteStream(output, { encoding: 'utf8' });
  const parser = createReadStream(resolve(input)).pipe(
    parse({
      bom: true,
      columns: true,
      delimiter: '|',
      skip_empty_lines: true,
      trim: true,
    })
  );

  let imported = 0;
  let skipped = 0;
  let batch = [];

  for await (const row of parser) {
    const zipCode = String(row.GEOID ?? '').trim();
    const latitude = Number(row.INTPTLAT);
    const longitude = Number(row.INTPTLONG);
    if (!/^\d{5}$/.test(zipCode) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      skipped += 1;
      continue;
    }
    imported += 1;
    batch.push({ zipCode, latitude, longitude, fetchedAt });
    if (batch.length >= BATCH_SIZE) {
      await writeChunk(destination, insertStatement(batch));
      batch = [];
    }
  }
  if (batch.length) await writeChunk(destination, insertStatement(batch));

  destination.end();
  await new Promise((resolvePromise, rejectPromise) => {
    destination.once('finish', resolvePromise);
    destination.once('error', rejectPromise);
  });

  console.log(
    JSON.stringify(
      {
        source: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
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
