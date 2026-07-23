import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from '../../src/hooks/useGeolocation';

const getCurrentPosition = vi.fn();

beforeEach(() => {
  getCurrentPosition.mockReset();
  Object.defineProperty(global.navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
});

describe('useGeolocation (privacy posture)', () => {
  it('does NOT call the browser location API on mount -- opt-in only', () => {
    renderHook(() => useGeolocation());
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('requestGps calls getCurrentPosition once and stores a gps-sourced location on success', () => {
    getCurrentPosition.mockImplementation((success: PositionCallback) =>
      success({ coords: { latitude: 29.65, longitude: -82.32 } } as GeolocationPosition)
    );
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestGps());
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(result.current.location).toMatchObject({ lat: 29.65, lng: -82.32, source: 'gps' });
    expect(result.current.status).toBe('granted');
  });

  it('sets denied status (and no location) when permission is refused', () => {
    getCurrentPosition.mockImplementation((_s: PositionCallback, err?: PositionErrorCallback) =>
      err?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
    );
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.requestGps());
    expect(result.current.status).toBe('denied');
    expect(result.current.location).toBeNull();
  });

  it('setFromZip stores a zip-sourced location WITHOUT touching the browser API', () => {
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.setFromZip({ lat: 29.7, lng: -82.4 }, '32605'));
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.location).toMatchObject({ lat: 29.7, lng: -82.4, source: 'zip', label: '32605' });
  });
});
