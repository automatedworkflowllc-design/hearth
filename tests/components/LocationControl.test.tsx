import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

    fireEvent.change(screen.getByLabelText(/gainesville-area zip/i), { target: { value: '32601' } });
    fireEvent.click(screen.getByRole('button', { name: /^set$/i }));

    expect(onSetZip).toHaveBeenCalledTimes(1);
    const [coords, zip] = onSetZip.mock.calls[0];
    expect(zip).toBe('32601');
    expect(coords.lat).toBeCloseTo(29.66, 1);
    expect(fetchSpy).not.toHaveBeenCalled(); // resolves entirely on-device
  });

  it('rejects an out-of-area ZIP without calling onSetZip', () => {
    const onSetZip = vi.fn();
    render(<LocationControl {...baseProps} onSetZip={onSetZip} />);

    fireEvent.change(screen.getByLabelText(/gainesville-area zip/i), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /^set$/i }));

    expect(onSetZip).not.toHaveBeenCalled();
    expect(screen.getByText(/outside our Gainesville-area demo coverage/i)).toBeInTheDocument();
  });
});
