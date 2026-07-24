import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useResources } from '../../src/hooks/useResources';
import type { ResourceProvider } from '../../src/providers/resourceProvider';
import type { Resource } from '../../src/types/index';

const sample: Resource[] = [
  { id: 'a', name: 'Alpha', category: 'food', description: 'd', location: {}, hours: 'x', tags: [] },
];

// Providers must be STABLE references -- useResources re-loads whenever the provider identity
// changes, so an inline object literal would re-trigger the effect on every render (an endless
// loading loop). Real callers pass module-level singletons like `staticProvider`, so these
// fixtures are defined once at module scope to match real usage.
const okProvider: ResourceProvider = {
  id: 'test',
  label: 'Test',
  load: async () => sample,
};

const failingProvider: ResourceProvider = {
  id: 'test-fail',
  label: 'Failing',
  load: async () => {
    throw new Error('boom');
  },
};

describe('useResources (the ResourceProvider async boundary)', () => {
  it('starts loading, then resolves to the provider dataset', async () => {
    const { result } = renderHook(() => useResources(okProvider));
    expect(result.current.status).toBe('loading');
    expect(result.current.resources).toEqual([]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.resources).toEqual(sample);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error (not a silent empty list) when the provider rejects', async () => {
    const { result } = renderHook(() => useResources(failingProvider));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('boom');
    expect(result.current.resources).toEqual([]);
  });
});
