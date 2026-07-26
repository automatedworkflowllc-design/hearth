import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
