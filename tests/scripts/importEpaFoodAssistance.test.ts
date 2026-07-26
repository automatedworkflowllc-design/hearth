import { describe, expect, it } from 'vitest';
// @ts-expect-error The production importer is intentionally plain ESM for Node and Actions.
import { normalizeEpaFoodFeature } from '../../scripts/import-epa-food-assistance.mjs';

const fetchedAt = '2026-07-26T12:00:00.000Z';
const sourceUpdatedAt = '2025-07-16T12:09:39.239Z';

function feature(overrides: Record<string, unknown> = {}) {
  return {
    attributes: {
      OBJECTID: 1,
      Name: 'Example Community Pantry',
      Type: 'Food Pantry',
      Address: '100 Main Street',
      City: 'Gainesville',
      State: 'FL',
      Zip_Code: '32601',
      Website: 'www.example.org/food',
      UniqueID: 'example-1',
      Latitude: 29.6516,
      Longitude: -82.3248,
      ...overrides,
    },
  };
}

describe('EPA year-round food assistance normalization', () => {
  it('normalizes a pantry and provides site-specific and national fallback contacts', () => {
    const result = normalizeEpaFoodFeature(feature(), fetchedAt, sourceUpdatedAt);

    expect(result.value).toMatchObject({
      sourceName: 'EPA / Hunger Free America',
      category: 'food',
      name: 'Example Community Pantry',
      website: 'https://www.example.org/food',
      type: 'Food Pantry',
    });
    expect(JSON.parse(result.value.servicesJson)).toContain('Food pantry groceries');
    expect(JSON.parse(result.value.tagsJson)).toEqual(
      expect.arrayContaining(['year-round food help', 'food pantry', 'groceries'])
    );
    expect(JSON.parse(result.value.contactsJson)).toEqual([
      expect.objectContaining({ type: 'website', primary: true }),
      expect.objectContaining({
        type: 'phone',
        label: 'USDA National Hunger Hotline',
        value: '1-866-348-6479',
      }),
    ]);
    expect(result.value.reviewNote).toMatch(/does not guarantee/i);
  });

  it('labels a soup kitchen as prepared community meals', () => {
    const result = normalizeEpaFoodFeature(
      feature({ Type: 'Soup Kitchen', Name: 'Example Community Kitchen' }),
      fetchedAt,
      sourceUpdatedAt
    );

    expect(JSON.parse(result.value.servicesJson)).toContain('Prepared community meals');
    expect(JSON.parse(result.value.tagsJson)).toContain('soup kitchen');
  });

  it.each([
    ['notDirectService', { Type: 'Food Bank' }],
    ['missingUsableWebsite', { Website: '' }],
    ['missingUsableWebsite', { Website: 'javascript:alert(1)' }],
    ['invalidAddress', { State: 'ZZ' }],
    ['invalidZip', { Zip_Code: '326' }],
    ['invalidCoordinates', { Latitude: 0 }],
    ['explicitTestRecord', { Name: 'Sample Pantry' }],
  ])('rejects unsafe records: %s', (reason, overrides) => {
    expect(normalizeEpaFoodFeature(feature(overrides), fetchedAt, sourceUpdatedAt)).toEqual({
      reason,
    });
  });
});
