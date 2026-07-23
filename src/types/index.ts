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

export interface ContactInfo {
  phone: string;
  email?: string;
  website?: string;
  emergencyPhone?: string;
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
  contact?: ContactInfo;
  phone?: string;
  email?: string;
  website?: string;
  hours: string | HoursOfOperation[];
  eligibility?: string;
  services?: string[];
  tags: string[];
  isAvailable?: boolean;
  availability?: string;
  availabilityStatus?: AvailabilityStatus;
  distanceMiles?: number;
  wheelchairAccessible?: boolean;
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
