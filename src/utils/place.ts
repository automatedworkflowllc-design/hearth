import type { Resource } from '../types/index';

/**
 * Build a place line people can act on. National records often store only a
 * street in `address` and keep city/state/ZIP on `location`; showing the street
 * alone makes a 70-mile-away listing look local.
 */
export function formatResourcePlace(resource: Resource): string | undefined {
  const city = resource.location?.city?.trim();
  const state = resource.location?.state?.trim();
  const zip = resource.location?.zipCode?.trim();
  const cityState = [city, state].filter(Boolean).join(', ');
  const place = [cityState, zip].filter(Boolean).join(' ');
  const address = resource.address?.trim();

  if (address && place) {
    const addressLower = address.toLowerCase();
    const alreadyIncludesCity = city ? addressLower.includes(city.toLowerCase()) : false;
    const alreadyIncludesState = state ? addressLower.includes(state.toLowerCase()) : true;
    if (alreadyIncludesCity && alreadyIncludesState) return address;
    return `${address}, ${place}`;
  }

  return address || place || undefined;
}
