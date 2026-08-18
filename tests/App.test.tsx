import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Resources now load through the ResourceProvider async boundary (useResources), so the first
// render shows a loading state; findByText waits for the (immediate) static provider to resolve.
const RESOURCE = 'Bread of the Mighty Food Bank';

describe('App integration', () => {
  it('loads and renders the verified Gainesville resources via the ResourceProvider', async () => {
    render(<App />);
    expect(await screen.findByText(RESOURCE)).toBeInTheDocument();
    expect(screen.getByText(/Showing 11 resources in the Gainesville, FL area/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/local demonstration directory/i);
    expect(screen.queryByRole('button', { name: /substance-use help/i })).not.toBeInTheDocument();
  });

  it('filters resources by search query', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    fireEvent.change(screen.getByLabelText(/search resources/i), { target: { value: 'peaceful' } });
    expect(await screen.findByText(/Peaceful Paths/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(RESOURCE)).not.toBeInTheDocument());
  });

  it('filters resources by category pill', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    fireEvent.click(screen.getByRole('button', { name: /legal aid/i }));
    expect(await screen.findByText('Three Rivers Legal Services')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(RESOURCE)).not.toBeInTheDocument());
  });

  it('offers quick-need paths that filter the directory', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    fireEvent.click(screen.getByRole('button', { name: /a safe place/i }));
    expect(await screen.findByText('GRACE Marketplace')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(RESOURCE)).not.toBeInTheDocument());
  });

  it('moves to the results when the search form is submitted', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    fireEvent.click(screen.getByRole('button', { name: /find help/i }));
    expect(screen.getByRole('heading', { name: /help near you/i })).toHaveFocus();
  });

  it('offers a location control without implying the directory is empty', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    expect(screen.getByText(/find help near you/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search this zip/i })).toBeInTheDocument();
    expect(screen.queryByText(/showing 0 resources/i)).not.toBeInTheDocument();
  });

  it('navbar search button focuses the search field (it used to be inert)', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    const input = screen.getByLabelText(/search resources/i);
    expect(document.activeElement).not.toBe(input);
    fireEvent.click(screen.getByRole('button', { name: /jump to search/i }));
    expect(document.activeElement).toBe(input);
  });

  it('opens the detail dialog and closes it with Escape', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    fireEvent.click(screen.getAllByRole('button', { name: /what to expect/i })[0]);
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

  it('skip link is the first focusable element and targets main content', async () => {
    const { container } = render(<App />);
    await screen.findByText(RESOURCE); // flush the async resource load inside act()
    const first = container.querySelector('a[href], button, input, select, [tabindex]:not([tabindex="-1"])');
    expect(first).toHaveAttribute('href', '#main-content');
  });

  it('text-size toolbar actually applies to <html> (hook is wired, not dead)', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    fireEvent.click(screen.getByRole('button', { name: 'Large text size' }));
    expect(document.documentElement.dataset.textSize).toBe('large');
    fireEvent.click(screen.getByRole('button', { name: 'Extra large text size' }));
    expect(document.documentElement.dataset.textSize).toBe('extra-large');
  });

  it('high-contrast toggle flips data-contrast on <html> (re-added in M4b, now real)', async () => {
    render(<App />);
    await screen.findByText(RESOURCE);
    const toggle = screen.getByRole('button', { name: /high contrast/i });
    expect(document.documentElement.dataset.contrast).toBe('standard');
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.contrast).toBe('high-contrast');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.contrast).toBe('standard');
  });
});
