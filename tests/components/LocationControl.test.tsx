import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationControl } from '../../src/components/LocationControl';

const baseProps = {
  location: null,
  status: 'idle' as const,
  error: null,
  onRequestGps: () => {},
  onClear: () => {},
};

describe('LocationControl ZIP fallback (on-device, no network)', () => {
  it('submitting a known Gainesville ZIP calls onSetZip with local coords and never fetches', () => {
    const fetchSpy = vi.fn();
    (globalThis as unknown as { fetch: unknown }).fetch = fetchSpy;
    const onSetZip = vi.fn();
    render(<LocationControl {...baseProps} onSetZip={onSetZip} />);

    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: '32601' } });
    fireEvent.click(screen.getByRole('button', { name: /search this zip/i }));

    expect(onSetZip).toHaveBeenCalledTimes(1);
    const [coords, zip] = onSetZip.mock.calls[0];
    expect(zip).toBe('32601');
    expect(coords.lat).toBeCloseTo(29.66, 1);
    expect(fetchSpy).not.toHaveBeenCalled(); // resolves entirely on-device
  });

  it('rejects an out-of-area ZIP without calling onSetZip', () => {
    const onSetZip = vi.fn();
    render(<LocationControl {...baseProps} onSetZip={onSetZip} />);

    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /search this zip/i }));

    expect(onSetZip).not.toHaveBeenCalled();
    expect(screen.getByText(/outside our Gainesville-area demo coverage/i)).toBeInTheDocument();
  });

  it('accepts any valid US ZIP when the national provider is active', () => {
    const onSetZip = vi.fn();
    const onSetPostalCode = vi.fn();
    render(
      <LocationControl
        {...baseProps}
        onSetZip={onSetZip}
        onSetPostalCode={onSetPostalCode}
        nationalCoverage
      />
    );

    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /search this zip/i }));

    expect(onSetPostalCode).toHaveBeenCalledWith('90210');
    expect(onSetZip).not.toHaveBeenCalled();
  });

  it('keeps only five digits as the user types', () => {
    render(<LocationControl {...baseProps} onSetZip={() => {}} />);
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: '32601-6789' } });
    expect(screen.getByLabelText(/zip code/i)).toHaveValue('32601');
  });

  it('copies a ZIP link only when asked and says the ZIP is in it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <LocationControl
        {...baseProps}
        location={{ source: 'zip', zipCode: '32601', label: '32601' }}
        onSetZip={() => {}}
        shareHref="https://example.test/hearth/?zip=32601"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://example.test/hearth/?zip=32601'));
    expect(screen.getByText(/includes this zip/i)).toBeInTheDocument();
  });
});
