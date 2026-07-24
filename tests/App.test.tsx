import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// The map is verified in-browser, not in jsdom (leaflet-in-jsdom is the theater the audit
// condemned). Mock react-leaflet so rendering <App/> is hermetic; these tests stay in list view.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CircleMarker: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({ setView: () => {}, fitBounds: () => {} }),
}));
vi.mock('leaflet', () => ({ default: { divIcon: () => ({}) } }));

import App from '../src/App';

describe('App integration', () => {
  it('renders the verified Gainesville resources', () => {
    render(<App />);
    expect(screen.getByText('Bread of the Mighty Food Bank')).toBeInTheDocument();
    expect(screen.getByText(/Showing 11 resources in the Gainesville, FL area/i)).toBeInTheDocument();
  });

  it('filters resources by search query', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/search resources/i), { target: { value: 'peaceful' } });
    expect(screen.getByText(/Peaceful Paths/i)).toBeInTheDocument();
    expect(screen.queryByText('Bread of the Mighty Food Bank')).not.toBeInTheDocument();
  });

  it('filters resources by category pill', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /legal aid/i }));
    expect(screen.getByText('Three Rivers Legal Services')).toBeInTheDocument();
    expect(screen.queryByText('Bread of the Mighty Food Bank')).not.toBeInTheDocument();
  });

  it('opens the detail dialog and closes it with Escape', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /view full details/i })[0]);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('accessibility wiring (was dead code before M3)', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-contrast');
    document.documentElement.removeAttribute('data-text-size');
    localStorage.clear();
  });

  it('skip link is the first focusable element and targets main content', () => {
    const { container } = render(<App />);
    const first = container.querySelector('a[href], button, input, select, [tabindex]:not([tabindex="-1"])');
    expect(first).toHaveAttribute('href', '#main-content');
  });

  it('text-size toolbar actually applies to <html> (hook is wired, not dead)', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Large text size' }));
    expect(document.documentElement.dataset.textSize).toBe('large');
    fireEvent.click(screen.getByRole('button', { name: 'Extra large text size' }));
    expect(document.documentElement.dataset.textSize).toBe('extra-large');
  });

  it('high-contrast toggle flips data-contrast on <html> (re-added in M4b, now real)', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: /high contrast/i });
    expect(document.documentElement.dataset.contrast).toBe('standard');
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.contrast).toBe('high-contrast');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.contrast).toBe('standard');
  });
});
