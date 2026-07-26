import type {
  DirectoryFacets,
  Resource,
  ResourceSearchRequest,
  ResourceSearchResponse,
} from '../types/index';
import { mockResources } from '../data/resources';
import { getDirectoryFacets } from '../services/dataQuality';
import { searchResources } from '../services/resourceService';

export type DirectoryCoverage = 'local-demo' | 'national';

/**
 * Query-based directory seam.
 *
 * The original load-all contract worked for eleven local records but could not scale to a
 * national directory. Providers now receive the search request and return only a bounded result
 * page. A server-backed provider can safely keep 211/API credentials off the public client.
 */
export interface ResourceProvider {
  readonly id: string;
  readonly label: string;
  readonly coverage: DirectoryCoverage;
  search(request: ResourceSearchRequest): Promise<ResourceSearchResponse>;
}

const staticFacets: DirectoryFacets = getDirectoryFacets(mockResources);

/** Bundled Gainesville demonstration data, queried through the national-ready contract. */
export const staticProvider: ResourceProvider = {
  id: 'static-gainesville',
  label: 'Reviewed Gainesville, FL demonstration dataset',
  coverage: 'local-demo',
  search: async (request) => {
    const resources = searchResources(
      request.query ?? '',
      request.category ?? 'all',
      request.city ?? 'all',
      request.tags ?? [],
      request.userLocation,
      request.sortBy ?? 'relevance',
      mockResources,
      {
        language: request.language,
        wheelchairAccessibleOnly: request.wheelchairAccessibleOnly,
      }
    );
    const limit = Math.max(1, Math.min(request.limit ?? (resources.length || 1), 100));
    return {
      resources: resources.slice(0, limit),
      total: resources.length,
      facets: staticFacets,
      generatedAt: new Date().toISOString(),
    };
  },
};

/** Prefer the national proxy when configured; keep local development honest otherwise. */
export function getConfiguredProvider(): ResourceProvider {
  const apiBaseUrl = import.meta.env.VITE_HEARTH_API_BASE_URL?.trim();
  if (!apiBaseUrl) return staticProvider;
  return createNationalApiProvider(apiBaseUrl);
}

export function createNationalApiProvider(apiBaseUrl: string): ResourceProvider {
  const base = apiBaseUrl.replace(/\/+$/, '');
  return {
    id: 'hearth-national-api',
    label: 'Hearth national resource directory',
    coverage: 'national',
    async search(request) {
      const url = new URL(`${base}/v1/resources/search`);
      const params: Record<string, string | undefined> = {
        q: request.query,
        category: request.category,
        need: request.need,
        city: request.city,
        sort: request.sortBy,
        language: request.language,
        wheelchair: request.wheelchairAccessibleOnly ? 'true' : undefined,
        lat: request.userLocation?.lat?.toString(),
        lng: request.userLocation?.lng?.toString(),
        zip: request.userLocation?.zipCode,
        limit: String(Math.max(1, Math.min(request.limit ?? 50, 100))),
        cursor: request.cursor,
      };
      for (const [key, value] of Object.entries(params)) {
        if (value && value !== 'all') url.searchParams.set(key, value);
      }
      for (const tag of request.tags ?? []) url.searchParams.append('tag', tag);

      const response = await fetch(url, {
        signal: request.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`The national directory is temporarily unavailable (${response.status}).`);
      }

      const payload = (await response.json()) as Partial<ResourceSearchResponse>;
      if (!Array.isArray(payload.resources)) {
        throw new Error('The national directory returned an invalid response.');
      }
      return {
        resources: payload.resources,
        total: typeof payload.total === 'number' ? payload.total : payload.resources.length,
        facets: payload.facets ?? { languages: [], hasWheelchairData: false },
        nextCursor: payload.nextCursor,
        generatedAt: payload.generatedAt,
      };
    },
  };
}
