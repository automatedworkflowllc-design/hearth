import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Resource } from '../../src/types/index';

// Capture the positions react-leaflet would render markers at, without a real map.
const { markerPositions } = vi.hoisted(() => ({ markerPositions: [] as unknown[] }));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ position, children }: { position: unknown; children?: React.ReactNode }) => {
    markerPositions.push(position);
    return <div>{children}</div>;
  },
  Popup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CircleMarker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({ setView: () => {}, fitBounds: () => {} }),
}));
vi.mock('leaflet', () => ({ default: { divIcon: () => ({}) } }));

import { ResourceMap } from '../../src/components/ResourceMap';

const data: Resource[] = [
  { id: 'mapped', name: 'Mapped Org', category: 'food', description: 'x', location: { lat: 29.66, lng: -82.33 }, contacts: [], hours: '', tags: [] },
  { id: 'nocoord', name: 'No Coord Org', category: 'shelter', description: 'x', location: { city: 'Gainesville' }, contacts: [], hours: '', tags: [] },
];

describe('ResourceMap coord handling (the 0,0 locus)', () => {
  it('renders a marker ONLY for resources with coordinates and notes the excluded one', () => {
    markerPositions.length = 0;
    render(<ResourceMap resources={data} userLocation={null} onSelect={() => {}} />);
    // Exactly one marker, at the mapped org's coords -- the coord-less org is never pinned (no 0,0).
    expect(markerPositions).toEqual([[29.66, -82.33]]);
    // ...and the honest "not shown on the map" notice appears for it.
    expect(screen.getByText(/1 resource without a fixed street location/i)).toBeInTheDocument();
  });
});
