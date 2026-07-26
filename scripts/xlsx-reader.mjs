import { readFile } from 'node:fs/promises';
import { posix } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';

function decodeXml(value) {
  return String(value ?? '').replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi,
    (entity, decimal, hexadecimal, named) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hexadecimal) return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      return (
        {
          amp: '&',
          apos: "'",
          gt: '>',
          lt: '<',
          quot: '"',
        }[named.toLowerCase()] ?? entity
      );
    }
  );
}

function attributes(source) {
  const values = {};
  const pattern = /([A-Za-z_][\w:.-]*)="([^"]*)"/g;
  for (const match of source.matchAll(pattern)) {
    values[match[1]] = decodeXml(match[2]);
  }
  return values;
}

function columnIndex(reference) {
  const letters = /^[A-Z]+/i.exec(reference)?.[0]?.toUpperCase();
  if (!letters) return 0;
  let index = 0;
  for (const letter of letters) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }
  return index - 1;
}

function textNodes(source) {
  return [...source.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1]))
    .join('');
}

export function parseSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    textNodes(match[1])
  );
}

export function parseWorksheet(xml, sharedStrings = []) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const values = [];
    const cellPattern = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    for (const cellMatch of rowMatch[1].matchAll(cellPattern)) {
      const cellAttributes = attributes(cellMatch[1]);
      const body = cellMatch[2] ?? '';
      const valueMatch = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(body);
      let value = '';
      if (cellAttributes.t === 'inlineStr') {
        value = textNodes(body);
      } else if (valueMatch) {
        const rawValue = decodeXml(valueMatch[1]);
        value =
          cellAttributes.t === 's'
            ? (sharedStrings[Number(rawValue)] ?? '')
            : rawValue;
      }
      values[columnIndex(cellAttributes.r ?? 'A1')] = value;
    }
    rows.push(
      Array.from({ length: values.length }, (_, index) => values[index] ?? '')
    );
  }
  return rows;
}

function workbookSheetPaths(workbookXml, relationshipsXml) {
  const relationships = new Map();
  for (const relationship of relationshipsXml.matchAll(/<Relationship\b([^>]*?)\/?>/g)) {
    const values = attributes(relationship[1]);
    if (values.Id && values.Target) relationships.set(values.Id, values.Target);
  }

  const sheets = new Map();
  for (const sheet of workbookXml.matchAll(/<sheet\b([^>]*?)\/?>/g)) {
    const values = attributes(sheet[1]);
    const target = relationships.get(values['r:id']);
    if (!values.name || !target) continue;
    const path = target.startsWith('/')
      ? target.slice(1)
      : posix.normalize(posix.join('xl', target));
    sheets.set(values.name, path);
  }
  return sheets;
}

function archiveText(archive, path, required = true) {
  const entry = archive[path];
  if (!entry) {
    if (!required) return '';
    throw new Error(`XLSX archive is missing ${path}.`);
  }
  return strFromU8(entry);
}

export async function readXlsxSheets(inputPath, requestedSheets) {
  const archive = unzipSync(new Uint8Array(await readFile(inputPath)));
  const workbookXml = archiveText(archive, 'xl/workbook.xml');
  const relationshipsXml = archiveText(archive, 'xl/_rels/workbook.xml.rels');
  const sharedStrings = parseSharedStrings(
    archiveText(archive, 'xl/sharedStrings.xml', false)
  );
  const sheetPaths = workbookSheetPaths(workbookXml, relationshipsXml);
  const result = new Map();

  for (const sheetName of requestedSheets) {
    const path = sheetPaths.get(sheetName);
    if (!path) {
      throw new Error(
        `XLSX workbook is missing the "${sheetName}" sheet. Found: ${[
          ...sheetPaths.keys(),
        ].join(', ')}.`
      );
    }
    result.set(sheetName, parseWorksheet(archiveText(archive, path), sharedStrings));
  }

  return result;
}

export function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((value) => String(value ?? '').trim());
  return rows.slice(1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))
  );
}
