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
      <div
        id="location-search"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card-hover px-4 py-3 text-sm text-main shadow-sm"
      >
        <span className="flex min-w-0 items-center gap-2 font-medium">
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Showing nearby results from {where}.
        </span>
        <button
          onClick={onClear}
          className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Change location
        </button>
      </div>
    );
  }

  return (
    <div
      id="location-search"
      className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-hover text-primary">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold text-main">Find help near you</p>
          <p className="mt-1 text-sm text-muted">
            {nationalCoverage
              ? 'Enter a US ZIP code or use your device location. Nearby search starts after this step.'
              : 'Optional: set a Gainesville-area ZIP or use your location to sort by distance.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <form onSubmit={submitZip} className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="zip-input" className="mb-1 block text-xs font-bold text-main">
              ZIP code
            </label>
            <input
              id="zip-input"
              inputMode="numeric"
              autoComplete="postal-code"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="e.g. 32601"
              className="min-h-11 w-full rounded-xl border border-border-input bg-app px-3.5 py-2 text-sm font-medium text-main placeholder:text-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded-xl bg-primary px-4 py-2.5 font-display text-sm font-bold text-inverse transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          >
            Search this ZIP
          </button>
        </form>

        <p className="hidden text-xs font-bold uppercase tracking-wide text-muted lg:block lg:px-2 lg:pb-3">
          or
        </p>
        <p className="text-center text-xs font-bold uppercase tracking-wide text-muted lg:hidden">or</p>

        <button
          onClick={onRequestGps}
          disabled={status === 'locating'}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-input bg-app px-4 py-2.5 text-sm font-bold text-main transition hover:bg-card-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-wait"
        >
          <LocateFixed className="h-4 w-4 text-primary" aria-hidden="true" />
          {status === 'locating' ? 'Locating…' : 'Use my location'}
        </button>
      </div>

      <p id="location-privacy" className="mt-3 text-xs leading-relaxed text-muted">
        {nationalCoverage
          ? 'The location you choose is sent only to the Hearth directory service to find nearby results.'
          : 'Used on this device to sort resources by distance — your location is never sent to us or stored.'}
        {' '}(The map view loads map tiles from OpenStreetMap, which like any website sees your IP address.)
      </p>
      {(zipError || error) && (
        <p className="mt-2 text-xs font-medium text-danger" role="alert">
          {zipError || error}
        </p>
      )}
    </div>
  );
};

export default LocationControl;
