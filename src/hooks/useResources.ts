import { useEffect, useState } from 'react';
import type { Resource } from '../types/index';
import type { ResourceProvider } from '../providers/resourceProvider';

export type ResourceLoadStatus = 'loading' | 'ready' | 'error';

/**
 * Loads resources from a ResourceProvider once on mount. This is the async boundary that lets the
 * static demo dataset and a future live feed share one code path: the rest of the app only ever sees
 * `resources` (a Resource[]) plus a status, exactly as it would with a real network source. Swapping
 * the provider (static -> live 211/HSDS) requires no change here or downstream.
 *
 * The provider must be a STABLE reference (a module-level singleton like `staticProvider`, or one
 * held in state/useMemo). Re-loading is keyed on provider identity, so passing a freshly-built
 * object literal on every render would re-trigger the load forever.
 */
export function useResources(provider: ResourceProvider) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [status, setStatus] = useState<ResourceLoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    provider
      .load()
      .then((data) => {
        if (cancelled) return;
        setResources(data);
        setStatus('ready');
      })
      .catch((e) => {
        if (cancelled) return;
        // A live provider can fail (offline, endpoint down). Surface it honestly so the UI can
        // fall back to 211 rather than showing a silent empty list.
        setError(e instanceof Error ? e.message : 'Could not load the resource directory.');
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [provider]);

  return { resources, status, error };
}
