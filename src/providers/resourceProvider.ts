import type { Resource } from '../types/index';
import { mockResources } from '../data/resources';

/**
 * The seam that makes Hearth portable beyond the demo.
 *
 * Everything downstream — the search/filter/sort/distance core in resourceService and the entire
 * UI — operates on a plain `Resource[]` and does not care where that list came from. A
 * `ResourceProvider` is simply "something that yields resources," and `load()` is async so a live
 * network feed fits the exact same shape as the bundled static dataset.
 *
 * Shipped today: `staticProvider` (the verified Gainesville dataset) — real, no network, no fabrication.
 *
 * The documented path to city-/state-/nationwide coverage is a SECOND implementation of this same
 * interface that reads a live directory — a 211 feed or the Open Referral HSDS standard — and maps its
 * records to `Resource[]`. Swapping it in is a one-line change at the app's composition root
 * (`useResources(liveProvider)`); the UI and search core need zero changes. That live implementation
 * is intentionally NOT included yet: it needs a real endpoint and field mapping, and shipping a fake
 * one would break the honesty rule this whole project is about. This interface is the entire contract
 * such a provider must satisfy.
 */
export interface ResourceProvider {
  /** Stable id for the source (e.g. 'static-gainesville', 'hsds-211'). */
  readonly id: string;
  /** Human-readable label, for attribution / a source picker. */
  readonly label: string;
  /** Load the resource set. Async by design so a network-backed source fits the same shape. */
  load(): Promise<Resource[]>;
}

/** The demo's provider: the verified, bundled Gainesville dataset. No network call, no fabrication. */
export const staticProvider: ResourceProvider = {
  id: 'static-gainesville',
  label: 'Verified Gainesville, FL (demo dataset)',
  load: async () => mockResources,
};
