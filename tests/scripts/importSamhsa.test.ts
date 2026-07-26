import { describe, expect, it } from 'vitest';
// @ts-expect-error The production importer is intentionally plain ESM for Node and Actions.
import { normalizeSamhsaDirectories } from '../../scripts/import-samhsa.mjs';
// @ts-expect-error The XLSX reader is intentionally plain ESM for Node and Actions.
import { parseSharedStrings, parseWorksheet, rowsToObjects } from '../../scripts/xlsx-reader.mjs';

describe('SAMHSA XLSX reader', () => {
  it('decodes shared strings, inline strings, and sparse cells', () => {
    const sharedStrings = parseSharedStrings(
      '<sst><si><t>name1</t></si><si><r><t>Example &amp; Co</t></r></si></sst>'
    );
    const rows = parseWorksheet(
      [
        '<worksheet><sheetData>',
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>zip</t></is></c></row>',
        '<row r="2"><c r="A2" t="s"><v>1</v></c><c r="C2"><v>32601</v></c></row>',
        '</sheetData></worksheet>',
      ].join(''),
      sharedStrings
    );

    expect(rowsToObjects(rows)).toEqual([{ name1: 'Example & Co', '': '', zip: '32601' }]);
  });
});

describe('SAMHSA normalization', () => {
  const base = {
    name1: 'Example Behavioral Health',
    name2: 'Downtown Clinic',
    street1: '100 Main Street',
    street2: '',
    city: 'Gainesville',
    state: 'FL',
    zip: '32601',
    phone: '352-555-0100',
    intake1: '',
    intake2: '',
    intake1a: '',
    intake2a: '',
    service_code_info: '',
  };
  const references = [
    {
      category_name: 'Type of Care',
      service_code: 'MH',
      service_name: 'Mental health treatment',
    },
    {
      category_name: 'Type of Care',
      service_code: 'SA',
      service_name: 'Substance use treatment',
    },
    {
      category_name: 'Service Setting',
      service_code: 'OP',
      service_name: 'Outpatient',
    },
  ];

  it('merges exact cross-directory locations and preserves intake contacts', () => {
    const result = normalizeSamhsaDirectories(
      {
        substanceUseRows: [
          {
            ...base,
            intake1: '877-555-0101 x2',
            service_code_info: 'SA OP',
          },
        ],
        mentalHealthRows: [{ ...base, service_code_info: 'MH OP' }],
        referenceRows: references,
      },
      '2026-07-26T00:00:00.000Z'
    );

    expect(result.stats).toMatchObject({
      sourceRows: 2,
      imported: 1,
      mergedDuplicates: 1,
      skipped: 0,
      withoutPhone: 0,
      unknownServiceCodes: [],
    });
    expect(result.records[0]).toMatchObject({
      category: 'health',
      zipCode: '32601',
      sourceName: 'SAMHSA',
    });
    expect(JSON.parse(result.records[0].contactsJson)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'phone', value: '352-555-0100' }),
        expect.objectContaining({ type: 'intake', value: '877-555-0101 x2' }),
      ])
    );
    expect(JSON.parse(result.records[0].servicesJson)).toEqual(
      expect.arrayContaining([
        'Mental health treatment',
        'Substance use treatment',
        'Outpatient',
      ])
    );
  });

  it('omits listings whose public street address is withheld', () => {
    const result = normalizeSamhsaDirectories(
      {
        substanceUseRows: [{ ...base, street1: '', service_code_info: 'SA' }],
        mentalHealthRows: [],
        referenceRows: references,
      },
      '2026-07-26T00:00:00.000Z'
    );

    expect(result.records).toEqual([]);
    expect(result.stats.skipped).toBe(1);
  });
});
