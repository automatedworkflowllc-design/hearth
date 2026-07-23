import { useState, useCallback } from 'react';

export type GeoStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'error';

export interface UserLocation {
  lat: number;
  lng: number;
  source: 'gps' | 'zip';
  label?: string; // e.g. the ZIP the user typed
}

/**
 * Opt-in geolocation. CRITICAL: this NEVER calls the browser location API on mount --
 * only when the user explicitly clicks (requestGps) or supplies a ZIP (setFromZip).
 * That is the whole privacy posture for a crisis-audience app: nothing about the user's
 * whereabouts is requested or transmitted until they choose it, and the ZIP path stays
 * entirely on-device (see gainesvilleZips.ts).
 */
export function useGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const requestGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unavailable');
      setError('Location is not available in this browser. You can enter a ZIP code instead.');
      return;
    }
    setStatus('locating');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'gps' });
        setStatus('granted');
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setStatus(denied ? 'denied' : 'error');
        setError(
          denied
            ? 'Location permission denied. You can enter a ZIP code instead.'
            : 'Could not get your location. You can enter a ZIP code instead.'
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const setFromZip = useCallback((coords: { lat: number; lng: number }, zip: string) => {
    setLocation({ lat: coords.lat, lng: coords.lng, source: 'zip', label: zip });
    setStatus('granted');
    setError(null);
  }, []);

  const clear = useCallback(() => {
    setLocation(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { location, status, error, requestGps, setFromZip, clear };
}
