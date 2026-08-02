import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QuickExit from '../../src/components/QuickExit';

// jsdom refuses real navigation, so stub location.replace to observe the call instead.
let replaceSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  replaceSpy = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, replace: replaceSpy },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('QuickExit', () => {
  it('leaves the site when the button is pressed', () => {
    render(<QuickExit />);
    fireEvent.click(screen.getByRole('button', { name: /leave quickly/i }));
    expect(replaceSpy).toHaveBeenCalledTimes(1);
  });

  // Regression guard: Escape is also the "close this dialog" key. If a single Escape triggered
  // Quick Exit, dismissing the resource modal would eject the user off the site entirely.
  it('does NOT leave on a single Escape (that key closes dialogs)', () => {
    render(<QuickExit />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  // Holding Escape emits auto-repeat keydowns; without filtering them, simply resting on the key
  // would eject the user.
  it('ignores auto-repeat Escape (holding the key must not trigger it)', () => {
    render(<QuickExit />);
    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(document, { key: 'Escape', repeat: true });
    }
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('leaves after three rapid Escape presses', () => {
    render(<QuickExit />);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(replaceSpy).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(replaceSpy).toHaveBeenCalledTimes(1);
  });

  // The window-expiry branch (now - t <= 1500ms) was the only part of the gesture
  // the suite did not pin down. Someone pressing Escape occasionally over several
  // seconds -- closing dialogs, hesitating -- must never be ejected off the site.
  it('does NOT leave when three presses are spread past the 1.5s window', () => {
    vi.useFakeTimers();
    try {
      render(<QuickExit />);
      fireEvent.keyDown(document, { key: 'Escape' });
      vi.advanceTimersByTime(2000);
      fireEvent.keyDown(document, { key: 'Escape' });
      vi.advanceTimersByTime(2000);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(replaceSpy).not.toHaveBeenCalled();
      // And stale presses must not linger: two more rapid presses complete a
      // fresh triple (the third press above + these two inside one window).
      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(replaceSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
