import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNationalApiProvider } from '../../src/providers/resourceProvider';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('national resource provider', () => {
  it('sends a bounded, credential-free query to the Hearth proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        resources: [],
        total: 0,
        facets: { languages: [], hasWheelchairData: false },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = createNationalApiProvider('https://directory.example.org/');
    await provider.search({
      query: 'food',
      category: 'food',
      need: 'mental-health',
      userLocation: { zipCode: '90210' },
      sortBy: 'distance',
      limit: 500,
      tags: ['pantry'],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.origin + url.pathname).toBe('https://directory.example.org/v1/resources/search');
    expect(url.searchParams.get('q')).toBe('food');
    expect(url.searchParams.get('need')).toBe('mental-health');
    expect(url.searchParams.get('zip')).toBe('90210');
    expect(url.searchParams.get('limit')).toBe('100');
    expect(url.searchParams.getAll('tag')).toEqual(['pantry']);
    expect(options.headers).toEqual({ Accept: 'application/json' });
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('rejects malformed national responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total: 10 }),
    }));

    await expect(
      createNationalApiProvider('https://directory.example.org').search({})
    ).rejects.toThrow(/invalid response/i);
  });
});
