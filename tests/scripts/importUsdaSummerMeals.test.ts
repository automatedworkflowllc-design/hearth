import { describe, expect, it } from 'vitest';
// @ts-expect-error The production importer is intentionally plain ESM for Node and Actions.
import { normalizeSummerMealFeature } from '../../scripts/import-usda-summer-meals.mjs';

const fetchedAt = '2026-07-26T12:00:00.000Z';
const sourceUpdatedAt = '2026-07-25T15:30:00.000Z';
const season = '2026';

function feature(overrides: Record<string, unknown> = {}, geometry = { x: -82.3248, y: 29.6516 }) {
  return {
    attributes: {
      Site_Name: 'Example Community Summer Meals',
      Site_Type: 'OPEN',
      Service_Model: 'CONGREGATE',
      Site_Address1: '100 Main Street',
      Site_Address2: '',
      Site_City: 'Gainesville',
      Site_State: 'FL',
      Site_Zip: '32601',
      Site_Phone: '352-555-0100',
      Ext: '',
      Contact_Phone: '352-555-0199',
      Sponsoring_Organization: 'Example School District',
      Start_date: Date.parse('2026-06-01T00:00:00.000Z'),
      End_date: Date.parse('2026-08-01T00:00:00.000Z'),
      Days_of_operation: 'M,T,W,TH,F',
      Comments: '',
      Site_Location: 'Fixed',
      Site_Program: 'SFSP',
      Season: '2026',
      Dropped: 'False',
      Expired: 'False',
      Breakfast_Time2: '',
      Lunch_Time2: '11:30 AM - 1:00 PM',
      Snack_Time_AM2: '',
      Snack_Time_PM2: '',
      Dinner_Supper_Time2: '',
      ...overrides,
    },
    geometry,
  };
}

describe('USDA SUN Meals normalization', () => {
  it('normalizes an open congregate meal site with source-backed details', () => {
    const result = normalizeSummerMealFeature(
      feature(),
      fetchedAt,
      sourceUpdatedAt,
      season
    );

    expect(result.value).toMatchObject({
      sourceName: 'USDA SUN Meals',
      category: 'food',
      name: 'Example Community Summer Meals',
      availabilityStart: '2026-06-01',
      availabilityEnd: '2026-08-01',
      serviceModel: 'CONGREGATE',
      siteType: 'OPEN',
      website: 'https://www.fns.usda.gov/summer/sitefinder',
      eligibility:
        'Free for children age 18 and under. No application is needed at open sites; meals are first come, first served.',
    });
    expect(result.value.hoursText).toContain('Mon, Tue, Wed, Thu, Fri');
    expect(result.value.hoursText).toContain('Lunch: 11:30 AM - 1:00 PM');
    expect(JSON.parse(result.value.servicesJson)).toContain('Free summer lunch');
    expect(JSON.parse(result.value.tagsJson)).toEqual(
      expect.arrayContaining(['food', 'free meals', 'eat on-site', 'lunch'])
    );
    expect(JSON.parse(result.value.contactsJson)).toHaveLength(2);
  });

  it('labels a program-only phone accurately and preserves a site-finder fallback', () => {
    const result = normalizeSummerMealFeature(
      feature({ Site_Phone: '' }),
      fetchedAt,
      sourceUpdatedAt,
      season
    );

    expect(JSON.parse(result.value.contactsJson)).toEqual([
      expect.objectContaining({
        label: 'Program contact',
        value: '352-555-0199',
        primary: true,
      }),
    ]);
    expect(result.value.website).toBe('https://www.fns.usda.gov/summer/sitefinder');
  });

  it('discloses restricted attendance and non-congregate pickup', () => {
    const result = normalizeSummerMealFeature(
      feature({
        Site_Type: 'OPEN RESTRICTED',
        Service_Model: 'NON-CONGREGATE PICK UP',
      }),
      fetchedAt,
      sourceUpdatedAt,
      season
    );

    expect(result.value.eligibility).toMatch(/attendance may be limited/i);
    expect(result.value.description).toMatch(/call before visiting/i);
    expect(JSON.parse(result.value.servicesJson)).toContain('SUN Meals To-Go pickup');
    expect(JSON.parse(result.value.tagsJson)).toEqual(
      expect.arrayContaining(['meals to-go', 'restricted open site'])
    );
  });

  it.each([
    ['wrongSeason', { Season: '2025' }, undefined],
    ['dropped', { Dropped: 'True' }, undefined],
    ['expired', { Expired: 'True' }, undefined],
    ['explicitTestRecord', { Comments: 'Staggs test cycle' }, undefined],
    ['missingMealSchedule', { Lunch_Time2: '' }, undefined],
    ['invalidCoordinates', {}, { x: 999, y: 29.6516 }],
  ])('rejects unsafe records: %s', (reason, overrides, geometry) => {
    const result = normalizeSummerMealFeature(
      feature(overrides, geometry),
      fetchedAt,
      sourceUpdatedAt,
      season
    );
    expect(result).toEqual({ reason });
  });
});
