export interface Location {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
}

export interface HoursOfOperation {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export type ContactMethodType = 'phone' | 'sms' | 'email' | 'website' | 'chat' | 'intake';

export interface ContactMethod {
  type: ContactMethodType;
  label: string;
  value: string;
  href: string;
  primary?: boolean;
  note?: string;
}

export interface ResourceSource {
  name: string;
  url: string;
  kind: 'official' | 'government' | 'directory';
}

export interface ResourceReview {
  reviewedAt: string;
  reviewDueAt: string;
  status?: 'standard' | 'exception';
  note?: string;
  sources: ResourceSource[];
}

export interface ResourceLanguage {
  code: string;
  label: string;
  access: 'service' | 'interpretation' | 'materials';
}

export interface ResourceAccessibility {
  wheelchair: 'yes' | 'no' | 'unknown';
  notes?: string[];
}

export type AvailabilityStatus = 'open' | 'closed' | 'limited' | 'unknown';
export type ResourceCategory = 'food' | 'shelter' | 'health' | 'legal' | 'support' | string;

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  address?: string;
  location: Location;
  contacts: ContactMethod[];
  hours: string | HoursOfOperation[];
  eligibility?: string;
  services?: string[];
  tags: string[];
  isAvailable?: boolean;
  availability?: string;
  availabilityStatus?: AvailabilityStatus;
  distanceMiles?: number;
  review?: ResourceReview;
  languages?: ResourceLanguage[];
  accessibility?: ResourceAccessibility;

  /** @deprecated Compatibility fields for external providers during migration. */
  phone?: string;
  email?: string;
  website?: string;
  lastVerified?: string;
  wheelchairAccessible?: boolean;
}

export interface DirectoryFacets {
  languages: { code: string; label: string }[];
  hasWheelchairData: boolean;
}

export interface ResourceSearchRequest {
  query?: string;
  category?: string;
  need?:
    | 'all'
    | 'food'
    | 'food-assistance'
    | 'summer-meals'
    | 'medical-care'
    | 'mental-health'
    | 'substance-use'
    | 'detox';
  city?: string;
  tags?: string[];
  userLocation?: Location;
  sortBy?: 'distance' | 'name' | 'relevance';
  language?: string;
  wheelchairAccessibleOnly?: boolean;
  limit?: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface ResourceSearchResponse {
  resources: Resource[];
  total: number;
  facets: DirectoryFacets;
  nextCursor?: string;
  generatedAt?: string;
  /**
   * false when the request carried a ZIP the directory has no centroid for.
   * "No results near you" and "we don't recognize that ZIP" are different
   * messages to a person in need; null/undefined when no ZIP was involved.
   */
  zipRecognized?: boolean | null;
}

export interface FilterOptions {
  searchQuery: string;
  category: string;
  tags: string[];
  sortBy: 'distance' | 'name' | 'relevance';
  userLocation?: {
    lat: number;
    lng: number;
  };
  language?: string;
  wheelchairAccessibleOnly?: boolean;
  openNowOnly?: boolean;
}

export type ContrastMode = 'standard' | 'high-contrast';
export type TextSize = 'normal' | 'large' | 'extra-large';

export interface AccessibilityState {
  contrastMode: ContrastMode;
  textSize: TextSize;
  toggleContrast: () => void;
  setTextSize: (size: TextSize) => void;
}
