import { useEffect, useState } from 'react';
import type {
  DirectoryFacets,
  Resource,
  ResourceSearchRequest,
} from '../types/index';
import type { ResourceProvider } from '../providers/resourceProvider';

export type ResourceLoadStatus = 'loading' | 'ready' | 'error';

const EMPTY_FACETS: DirectoryFacets = { languages: [], hasWheelchairData: false };

/**
 * Runs a bounded query against either the bundled demo or a server-backed national provider.
 * In-flight requests are aborted when the query changes, preventing stale results from winning.
 */
export function useResources(
  provider: ResourceProvider,
  request: ResourceSearchRequest,
  enabled = true
) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<DirectoryFacets>(EMPTY_FACETS);
  const [status, setStatus] = useState<ResourceLoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setResources([]);
      setTotal(0);
      setFacets(EMPTY_FACETS);
      setStatus('ready');
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setStatus('loading');
    setError(null);

    provider
      .search({ ...request, signal: controller.signal })
      .then((result) => {
        if (cancelled) return;
        setResources(result.resources);
        setTotal(result.total);
        setFacets(result.facets);
        setStatus('ready');
      })
      .catch((errorValue) => {
        if (cancelled || controller.signal.aborted) return;
        setError(errorValue instanceof Error ? errorValue.message : 'Could not search the resource directory.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, provider, request]);

  return {
    resources,
    total,
    facets,
    status,
    error,
    providerLabel: provider.label,
    coverage: provider.coverage,
  };
}
