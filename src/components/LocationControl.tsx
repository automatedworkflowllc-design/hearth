import React, { useState } from 'react';
import { MapPin, LocateFixed, X } from 'lucide-react';
import type { UserLocation, GeoStatus } from '../hooks/useGeolocation';
import { zipToCoords } from '../data/gainesvilleZips';

interface LocationControlProps {
  location: UserLocation | null;
  status: GeoStatus;
  error: string | null;
  onRequestGps: () => void;
  onSetZip: (coords: { lat: number; lng: number }, zip: string) => void;
  onSetPostalCode?: (zip: string) => void;
  nationalCoverage?: boolean;
  onClear: () => void;
}

export const LocationControl: React.FC<LocationControlProps> = ({
  location,
  status,
  error,
  onRequestGps,
  onSetZip,
  onSetPostalCode,
  nationalCoverage = false,
  onClear,
}) => {
  const [zip, setZip] = useState('');
  const [zipError, setZipError] = useState<string | null>(null);

  const submitZip = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedZip = zip.trim().slice(0, 5);
    if (nationalCoverage) {
      if (!/^\d{5}$/.test(normalizedZip)) {
        setZipError('Enter a valid 5-digit ZIP code.');
        return;
      }
      setZipError(null);
      onSetPostalCode?.(normalizedZip);
      return;
    }
    const coords = zipToCoords(zip);
    if (!coords) {
      setZipError('That ZIP is outside our Gainesville-area demo coverage.');
      return;
    }
    setZipError(null);
    onSetZip(coords, normalizedZip);
  };

  if (location) {
    const where = location.source === 'gps' ? 'your location' : `ZIP ${location.label}`;
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card-hover px-4 py-2.5 text-sm text-main">
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sorting by distance from {where}.
        </span>
        <button
          onClick={onClear}
          className="flex min-h-11 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={onRequestGps}
          disabled={status === 'locating'}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-inverse transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          {status === 'locating' ? 'Locating…' : 'Use my location'}
        </button>

        <span className="text-xs font-medium text-muted sm:px-1">or</span>

        <form onSubmit={submitZip} className="flex items-center gap-2">
          <label htmlFor="zip-input" className="sr-only">
            Enter a ZIP code
          </label>
          <input
            id="zip-input"
            inputMode="numeric"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="ZIP code"
            className="min-h-11 w-28 rounded-lg border border-border-input bg-app px-3 py-2 text-sm text-main placeholder:text-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="min-h-11 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-main transition hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Set
          </button>
        </form>
      </div>

      <p className="mt-2 text-xs text-muted">
        {nationalCoverage
          ? 'The location you choose is sent only to the Hearth directory service to find nearby results.'
          : 'Used on this device to sort resources by distance — your location is never sent to us or stored.'}
        {' '}(The map view loads map tiles from OpenStreetMap, which like any website sees your IP address.)
      </p>
      {(zipError || error) && (
        <p className="mt-1 text-xs font-medium text-danger" role="alert">
          {zipError || error}
        </p>
      )}
    </div>
  );
};

export default LocationControl;
