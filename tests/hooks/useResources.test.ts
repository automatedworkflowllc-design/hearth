import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useResources } from '../../src/hooks/useResources';
import type { ResourceProvider } from '../../src/providers/resourceProvider';
import type { Resource } from '../../src/types/index';

const sample: Resource[] = [
  { id: 'a', name: 'Alpha', category: 'food', description: 'd', location: {}, hours: 'x', tags: [] },
];

function provider(over: Partial<ResourceProvider> = {}): ResourceProvider {
  return { id: 'test', label: 'Test', load: async () => sample, ...over };
}

describe('useResources (the ResourceProvider async boundary)', () => {
  it('starts loading, then resolves to the provider dataset', async () => {
    const { result } = renderHook(() => useResources(provider()));
    expect(result.current.status).toBe('loading');
    expect(result.current.resources).toEqual([]);
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.resources).toEqual(sample);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error (not a silent empty list) when the provider rejects', async () => {
    const failing = provider({
      load: async () => {
        throw new Error('boom');
      },
    });
    const { result } = renderHook(() => useResources(failing));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('boom');
    expect(result.current.resources).toEqual([]);
  });
});
