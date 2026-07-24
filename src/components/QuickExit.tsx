import React, { useEffect, useRef } from 'react';
import { DoorOpen } from 'lucide-react';

// A neutral, unrelated, well-known site -- the point is to leave no trace of Hearth on screen.
const SAFE_DESTINATION = 'https://www.weather.com/';

// Three presses within this window count as the deliberate "get me out" gesture.
const ESCAPE_COUNT = 3;
const ESCAPE_WINDOW_MS = 1500;

function leaveQuickly() {
  // replace() so Hearth is not left in the back-button history.
  window.location.replace(SAFE_DESTINATION);
}

/**
 * Always-on-screen escape hatch for someone on a monitored device (the audience Quick Exit
 * exists for). Fixed position so it survives scrolling.
 *
 * The keyboard shortcut is Escape pressed THREE times within 1.5s, matching the Trevor
 * Project's triple-press pattern. A single Escape is deliberately NOT the trigger: Escape is
 * also the normal "close this dialog" key (the resource detail modal uses it), so a single-press
 * trigger would eject someone off the site every time they dismissed a dialog -- and an
 * accidental exit mid-search is a real cost for someone who may be on a borrowed phone with
 * limited time.
 */
export const QuickExit: React.FC = () => {
  const presses = useRef<number[]>([]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const now = Date.now();
      presses.current = [...presses.current, now].filter((t) => now - t <= ESCAPE_WINDOW_MS);
      if (presses.current.length >= ESCAPE_COUNT) {
        presses.current = [];
        leaveQuickly();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <button
      type="button"
      onClick={leaveQuickly}
      aria-label="Leave quickly — go to a neutral website"
      title="Leave this site immediately (or press Escape three times). Afterward, clear your browser history to remove the visit."
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-nav px-4 py-2.5 text-sm font-bold text-on-nav shadow-lg transition-colors hover:bg-nav-hover"
    >
      <DoorOpen className="h-4 w-4" aria-hidden="true" />
      Leave quickly
    </button>
  );
};

export default QuickExit;
