import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResources } from '../../src/hooks/useResources';
import type { ResourceProvider } from '../../src/providers/resourceProvider';
import type { Resource, ResourceSearchRequest } from '../../src/types/index';

const sample: Resource[] = [
  {
    id: 'a',
    name: 'Alpha',
    category: 'food',
    description: 'd',
    location: {},
    contacts: [],
    hours: 'x',
    tags: [],
  },
];
const request: ResourceSearchRequest = { query: '' };

const okProvider: ResourceProvider = {
  id: 'test',
  label: 'Test',
  coverage: 'national',
  search: async () => ({
    resources: sample,
    total: 1,
    facets: { languages: [], hasWheelchairData: false },
  }),
};

const failingProvider: ResourceProvider = {
  id: 'test-fail',
  label: 'Failing',
  coverage: 'national',
  search: async () => {
    throw new Error('boom');
  },
};

describe('useResources (the query-based provider boundary)', () => {
  it('starts loading, then resolves a bounded provider result', async () => {
    const { result } = renderHook(() => useResources(okProvider, request));
    expect(result.current.status).toBe('loading');
    expect(result.current.resources).toEqual([]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.resources).toEqual(sample);
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error rather than a silent empty list', async () => {
    const { result } = renderHook(() => useResources(failingProvider, request));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('boom');
    expect(result.current.resources).toEqual([]);
  });

  it('does not spend a provider query while national search is waiting for location', async () => {
    const search = vi.fn(okProvider.search);
    const provider = { ...okProvider, search };
    const { result } = renderHook(() => useResources(provider, request, false));

    expect(result.current.status).toBe('ready');
    expect(result.current.total).toBe(0);
    expect(search).not.toHaveBeenCalled();
  });

  it('appends the next page without dropping the first page', async () => {
    const pageOne = { ...sample[0], id: 'a', name: 'Alpha' };
    const pageTwo = { ...sample[0], id: 'b', name: 'Beta' };
    const search = vi.fn(async (incoming: ResourceSearchRequest) => {
      if (!incoming.cursor) {
        return {
          resources: [pageOne],
          total: 2,
          nextCursor: 'page-2',
          facets: { languages: [], hasWheelchairData: false },
        };
      }
      return {
        resources: [pageTwo],
        total: 2,
        facets: { languages: [], hasWheelchairData: false },
      };
    });
    const provider: ResourceProvider = { ...okProvider, search };
    const { result } = renderHook(() => useResources(provider, request));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.resources.map((resource) => resource.id)).toEqual(['a']);

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.resources.map((resource) => resource.id)).toEqual(['a', 'b']));
    expect(result.current.nextCursor).toBeUndefined();
    expect(result.current.status).toBe('ready');
  });
});
