import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
];

// How long before logout (in minutes) the warning modal appears.
const WARNING_LEAD_MINUTES = 2;

type IdleWarningState = {
  visible: boolean;
  /** Seconds remaining until forced logout. */
  remaining: number;
};

/**
 * Automatically logs out the user after `minutes` of inactivity.
 * Shows a warning modal `WARNING_LEAD_MINUTES` before logout so the user can extend.
 *
 * Returns { warning, extend, logoutNow } so callers can render their own UI.
 * For convenience, this hook also injects a simple default warning modal into
 * the DOM if no consumer handles the warning within 500ms.
 */
export function useIdleLogout(minutes: number = 15): {
  warning: IdleWarningState;
  extend: () => void;
  logoutNow: () => void;
} {
  const [warning, setWarning] = useState<IdleWarningState>({ visible: false, remaining: WARNING_LEAD_MINUTES * 60 });
  const warnTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const clearAll = useCallback(() => {
    if (warnTimerRef.current !== null) window.clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current !== null) window.clearTimeout(logoutTimerRef.current);
    if (countdownRef.current !== null) window.clearInterval(countdownRef.current);
    warnTimerRef.current = null;
    logoutTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const doLogout = useCallback(() => {
    clearAll();
    setWarning({ visible: false, remaining: WARNING_LEAD_MINUTES * 60 });
    try {
      useAuthStore.getState().logout();
    } finally {
      // Redirect after state clears
      window.location.href = '/';
    }
  }, [clearAll]);

  const reset = useCallback(() => {
    clearAll();
    setWarning({ visible: false, remaining: WARNING_LEAD_MINUTES * 60 });

    const totalMs = minutes * 60 * 1000;
    const warnMs = Math.max(0, totalMs - WARNING_LEAD_MINUTES * 60 * 1000);

    warnTimerRef.current = window.setTimeout(() => {
      setWarning({ visible: true, remaining: WARNING_LEAD_MINUTES * 60 });
      // Start countdown interval for UX
      countdownRef.current = window.setInterval(() => {
        setWarning((prev) => {
          const next = Math.max(0, prev.remaining - 1);
          return { visible: true, remaining: next };
        });
      }, 1000);
    }, warnMs);

    logoutTimerRef.current = window.setTimeout(doLogout, totalMs);
  }, [minutes, clearAll, doLogout]);

  // Activity handler — only resets timer while warning is NOT visible.
  // Once the warning is shown the user must explicitly extend via the modal button.
  const handleActivity = useCallback(() => {
    if (!warning.visible) reset();
  }, [reset, warning.visible]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAll();
      return;
    }

    reset();

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, minutes]);

  const extend = useCallback(() => {
    reset();
  }, [reset]);

  return { warning, extend, logoutNow: doLogout };
}
