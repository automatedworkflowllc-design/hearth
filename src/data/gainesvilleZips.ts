// Offline ZIP-centroid lookup for the "near me" fallback.
//
// Why offline: the audience is privacy-sensitive (people in crisis), so a user who
// declines GPS can type a ZIP and get an approximate location with ZERO third-party
// requests -- nothing about them leaves the browser. These are APPROXIMATE ZIP-area
// centroids for the Gainesville, FL area, geocoded from OpenStreetMap (not surveyed
// rooftops). Good enough to sort resources by rough distance; not a precise position.
//
// This is a demo covering one metro; the national version would swap this for a real
// ZIP-centroid dataset behind the same lookup, same as the ResourceProvider seam.
export const GAINESVILLE_ZIP_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  '32601': { lat: 29.6607936, lng: -82.3372714 },
  '32603': { lat: 29.6574586, lng: -82.3454854 },
  '32605': { lat: 29.6784791, lng: -82.3686144 },
  '32606': { lat: 29.7011138, lng: -82.3885932 },
  '32607': { lat: 29.6346892, lng: -82.3735589 },
  '32608': { lat: 29.6236892, lng: -82.3835589 }, // SW Gainesville (Haile/Tower Rd); nudged south of 32607
  '32609': { lat: 29.6922971, lng: -82.3078037 },
  '32612': { lat: 29.6397515, lng: -82.3549078 },
  '32641': { lat: 29.6449136, lng: -82.2885589 },
  '32653': { lat: 29.7083571, lng: -82.3915798 },
};

/** Approximate coordinates for a Gainesville-area ZIP, or null if we don't cover it. */
export function zipToCoords(zip: string): { lat: number; lng: number } | null {
  const key = (zip || '').trim().slice(0, 5);
  return GAINESVILLE_ZIP_CENTROIDS[key] ?? null;
}
