import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DirectoryFacets,
  Resource,
  ResourceSearchRequest,
  SearchCoverage,
} from '../types/index';
import type { ResourceProvider } from '../providers/resourceProvider';

export type ResourceLoadStatus = 'loading' | 'ready' | 'error';

const EMPTY_FACETS: DirectoryFacets = { languages: [], hasWheelchairData: false };

function mergeResources(current: Resource[], incoming: Resource[]): Resource[] {
  const seen = new Set(current.map((resource) => resource.id));
  const appended = incoming.filter((resource) => {
    if (seen.has(resource.id)) return false;
    seen.add(resource.id);
    return true;
  });
  return appended.length === 0 ? current : [...current, ...appended];
}

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
  const [zipRecognized, setZipRecognized] = useState<boolean | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [searchCoverage, setSearchCoverage] = useState<SearchCoverage | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadMoreController = useRef<AbortController | null>(null);

  useEffect(() => {
    loadMoreController.current?.abort();
    loadMoreController.current = null;
    setLoadingMore(false);
    setLoadMoreError(null);

    if (!enabled) {
      setResources([]);
      setTotal(0);
      setFacets(EMPTY_FACETS);
      setStatus('ready');
      setError(null);
      setZipRecognized(null);
      setNextCursor(undefined);
      setSearchCoverage(undefined);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setStatus('loading');
    setError(null);

    provider
      .search({ ...request, cursor: undefined, signal: controller.signal })
      .then((result) => {
        if (cancelled) return;
        setResources(result.resources);
        setTotal(result.total);
        setFacets(result.facets);
        setZipRecognized(result.zipRecognized ?? null);
        setNextCursor(result.nextCursor);
        setSearchCoverage(result.coverage);
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

  const loadMore = useCallback(() => {
    if (!enabled || !nextCursor || loadingMore || status !== 'ready') return;
    const controller = new AbortController();
    loadMoreController.current = controller;
    setLoadingMore(true);
    setLoadMoreError(null);
    provider
      .search({ ...request, cursor: nextCursor, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setResources((current) => mergeResources(current, result.resources));
        setTotal(result.total);
        setFacets(result.facets);
        setNextCursor(result.nextCursor);
        setSearchCoverage(result.coverage);
        setLoadingMore(false);
      })
      .catch((errorValue) => {
        if (controller.signal.aborted) return;
        setLoadingMore(false);
        setLoadMoreError(
          errorValue instanceof Error ? errorValue.message : 'Could not load more listings.'
        );
      });
  }, [enabled, loadingMore, nextCursor, provider, request, status]);

  return {
    resources,
    total,
    facets,
    status,
    error,
    zipRecognized,
    nextCursor,
    loadMore,
    loadingMore,
    loadMoreError,
    searchCoverage,
    providerLabel: provider.label,
    coverage: provider.coverage,
  };
}
