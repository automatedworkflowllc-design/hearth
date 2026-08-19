import { describe, expect, it } from 'vitest';
import { directorySearchHref, parseDirectorySearchParams } from '../../src/utils/searchParams';

describe('directory search params', () => {
  it('reads a well-formed ZIP and need', () => {
    expect(parseDirectorySearchParams('?zip=32601&need=mental-health')).toEqual({
      zip: '32601',
      need: 'mental-health',
    });
  });

  it('ignores invented needs and malformed ZIPs', () => {
    expect(parseDirectorySearchParams('zip=12&need=warm-bed')).toEqual({});
    expect(parseDirectorySearchParams('zip=32601-1234')).toEqual({});
  });

  it('builds a share URL with ZIP only, never coordinates', () => {
    const href = directorySearchHref(
      '32601',
      'food-assistance',
      'https://automatedworkflowllc-design.github.io/hearth/'
    );
    expect(href).toBe(
      'https://automatedworkflowllc-design.github.io/hearth/?zip=32601&need=food-assistance'
    );
    expect(href).not.toMatch(/lat=|lng=/);
  });
});
