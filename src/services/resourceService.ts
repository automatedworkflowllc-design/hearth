import type { Resource, Location } from '../types/index.ts';
import { mockResources } from '../data/resources.ts';

/**
 * Calculates the Haversine distance between two geographical points in miles.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return 0;
  }

  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Retrieves a resource by its unique ID.
 */
export function getResourceById(id: string, dataset: Resource[] = mockResources): Resource | undefined {
  if (!id) return undefined;
  return dataset.find(resource => resource.id === id);
}

/**
 * Searches and filters community resources according to query, category, city/location, tags, and sort preference.
 */
export function searchResources(
  query: string = '',
  category: string = 'all',
  cityFilter: string = 'all',
  tags: string[] = [],
  userLocation?: Location,
  sortBy: 'distance' | 'name' | 'relevance' = 'relevance',
  dataset: Resource[] = mockResources
): Resource[] {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCategory = category.trim().toLowerCase();
  const normalizedCity = cityFilter.trim().toLowerCase();

  let results = dataset.filter(resource => {
    // 1. Category Filter
    if (normalizedCategory !== '' && normalizedCategory !== 'all' && normalizedCategory !== 'all categories') {
      if (resource.category.toLowerCase() !== normalizedCategory) {
        return false;
      }
    }

    // 2. City / Location Filter
    if (normalizedCity !== '' && normalizedCity !== 'all' && normalizedCity !== 'all locations') {
      const resCity = (resource.location?.city || '').toLowerCase();
      const resState = (resource.location?.state || '').toLowerCase();
      const resAddress = (resource.address || '').toLowerCase();

      const cityMatch = resCity.includes(normalizedCity) || resState.includes(normalizedCity) || resAddress.includes(normalizedCity);
      if (!cityMatch) {
        return false;
      }
    }

    // 3. Tags Filter
    if (tags && tags.length > 0) {
      const resourceTags = (resource.tags || []).map(t => t.toLowerCase());
      const matchesAllTags = tags.every(tag => resourceTags.includes(tag.toLowerCase()));
      if (!matchesAllTags) {
        return false;
      }
    }

    // 4. Search Query Filter (Checks City, State, Zip, Address, Name, Desc, Category, Tags)
    if (normalizedQuery.length > 0) {
      const inName = resource.name.toLowerCase().includes(normalizedQuery);
      const inDesc = resource.description.toLowerCase().includes(normalizedQuery);
      const inAddress = (resource.address || '').toLowerCase().includes(normalizedQuery);
      const inCity = (resource.location?.city || '').toLowerCase().includes(normalizedQuery);
      const inState = (resource.location?.state || '').toLowerCase().includes(normalizedQuery);
      const inZip = (resource.location?.zipCode || '').toLowerCase().includes(normalizedQuery);
      const inTags = (resource.tags || []).some(t => t.toLowerCase().includes(normalizedQuery));
      const inCategory = resource.category.toLowerCase().includes(normalizedQuery);

      if (!inName && !inDesc && !inAddress && !inCity && !inState && !inZip && !inTags && !inCategory) {
        return false;
      }
    }

    return true;
  });

  // 5. Sorting
  if (sortBy === 'distance' && userLocation) {
    const userLat = userLocation.lat ?? userLocation.latitude;
    const userLng = userLocation.lng ?? userLocation.longitude;
    if (typeof userLat === 'number' && typeof userLng === 'number') {
      results = [...results].sort((a, b) => {
        const aLat = a.location.lat ?? a.location.latitude ?? 0;
        const aLng = a.location.lng ?? a.location.longitude ?? 0;
        const bLat = b.location.lat ?? b.location.latitude ?? 0;
        const bLng = b.location.lng ?? b.location.longitude ?? 0;
        const distA = calculateDistance(userLat, userLng, aLat, aLng);
        const distB = calculateDistance(userLat, userLng, bLat, bLng);
        return distA - distB;
      });
    }
  } else if (sortBy === 'name') {
    results = [...results].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'relevance' && normalizedQuery.length > 0) {
    results = [...results].sort((a, b) => {
      const nameMatchA = a.name.toLowerCase().includes(normalizedQuery) ? 2 : 0;
      const nameMatchB = b.name.toLowerCase().includes(normalizedQuery) ? 2 : 0;
      return nameMatchB - nameMatchA;
    });
  }

  return results;
}
