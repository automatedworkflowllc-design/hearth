import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Resource } from '../types/index';
import type { UserLocation } from '../hooks/useGeolocation';

interface ResourceMapProps {
  resources: Resource[];
  userLocation: UserLocation | null;
  onSelect: (resource: Resource) => void;
}

const GAINESVILLE_CENTER: [number, number] = [29.6516, -82.3248];

function coordsOf(r: Resource): [number, number] | null {
  const lat = r.location?.lat ?? r.location?.latitude;
  const lng = r.location?.lng ?? r.location?.longitude;
  // Finite-only: a NaN/missing coord must be excluded from the map, never pinned at 0,0.
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat as number, lng as number] : null;
}

// Inline-SVG pin via divIcon -- avoids Leaflet's broken default marker asset paths under Vite.
const pinIcon = L.divIcon({
  className: 'resource-pin',
  html:
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" ' +
    'fill="#2563eb" stroke="#ffffff" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>' +
    '<circle cx="12" cy="9" r="2.6" fill="#ffffff"/></svg>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

function FitToMarkers({ points, fitKey }: { points: [number, number][]; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView(GAINESVILLE_CENTER, 12);
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(points, { padding: [40, 40] });
    }
    // Keyed on fitKey (the RESOURCE coordinate set) only -- deliberately NOT on the
    // user's location (so which OSM tiles load never depends on where they are) and NOT
    // on array identity (so re-sorting doesn't discard the user's manual pan/zoom).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

export const ResourceMap: React.FC<ResourceMapProps> = ({ resources, userLocation, onSelect }) => {
  const pinned = useMemo(
    () =>
      resources
        .map((r) => ({ r, pt: coordsOf(r) }))
        .filter((x): x is { r: Resource; pt: [number, number] } => x.pt !== null),
    [resources]
  );
  // Fit to RESOURCE locations only. The user's location is a render-only marker and is
  // deliberately excluded from the viewport so the set of OSM tiles requested never
  // depends on where the user is (privacy: nothing about their position reaches the tile server).
  const fitPoints = useMemo(() => pinned.map((p) => p.pt), [pinned]);
  const fitKey = useMemo(() => fitPoints.map((p) => p.join(',')).sort().join('|'), [fitPoints]);

  const unmapped = resources.length - pinned.length;

  return (
    <div>
      <div className="h-[460px] w-full overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer center={GAINESVILLE_CENTER} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToMarkers points={fitPoints} fitKey={fitKey} />
          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={9}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#059669', fillOpacity: 1 }}
            >
              <Popup>You are here ({userLocation.source === 'gps' ? 'your location' : `ZIP ${userLocation.label}`})</Popup>
            </CircleMarker>
          )}
          {pinned.map(({ r, pt }) => (
            <Marker key={r.id} position={pt} icon={pinIcon}>
              <Popup>
                <div className="min-w-[180px]">
                  <p className="text-sm font-bold text-slate-900">{r.name}</p>
                  {r.address && <p className="mt-0.5 text-xs text-slate-600">{r.address}</p>}
                  <button
                    onClick={() => onSelect(r)}
                    className="mt-2 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    View details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {unmapped > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {unmapped} resource{unmapped === 1 ? '' : 's'} without a fixed street location (e.g. phone/referral-only) {unmapped === 1 ? 'is' : 'are'} not shown on the map — see the list view.
        </p>
      )}
    </div>
  );
};

export default ResourceMap;
