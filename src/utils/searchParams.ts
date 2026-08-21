export const NATIONAL_NEED_IDS = [
  'food-assistance',
  'summer-meals',
  'medical-care',
  'mental-health',
  'substance-use',
  'detox',
] as const;

export type NationalNeedId = (typeof NATIONAL_NEED_IDS)[number];

export interface DirectorySearchParams {
  zip?: string;
  need?: NationalNeedId;
}

function isNationalNeed(value: string): value is NationalNeedId {
  return (NATIONAL_NEED_IDS as readonly string[]).includes(value);
}

/** Read public search state from the URL. ZIP in a link is opt-in sharing, not tracking. */
export function parseDirectorySearchParams(search: string): DirectorySearchParams {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const zipRaw = params.get('zip')?.trim() ?? '';
  const zip = /^\d{5}$/.test(zipRaw) ? zipRaw : undefined;
  const needRaw = params.get('need')?.trim().toLowerCase() ?? '';
  const need = isNationalNeed(needRaw) ? needRaw : undefined;
  return { zip, need };
}

/**
 * Build a shareable Hearth URL that contains only a ZIP (and optional need).
 * GPS coordinates are never placed in the link.
 */
export function directorySearchHref(
  zip: string,
  need?: string,
  currentUrl: string = typeof window === 'undefined' ? 'https://example.invalid/' : window.location.href
): string {
  const url = new URL(currentUrl);
  url.hash = '';
  url.search = '';
  url.searchParams.set('zip', zip);
  if (need && need !== 'all' && isNationalNeed(need)) {
    url.searchParams.set('need', need);
  }
  return url.toString();
}
