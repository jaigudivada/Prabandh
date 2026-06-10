import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that provides auto-refresh functionality:
 * - Refreshes data at a set interval (polling)
 * - Refreshes when the tab becomes visible again
 * - Refreshes immediately when called
 *
 * IMPORTANT: The refreshFn will receive `true` as the first argument
 * when called from a background/auto-refresh, and `false` (or nothing)
 * when called manually on initial load. Use this to avoid showing
 * loading spinners/skeletons during silent background updates.
 *
 * @param {Function} refreshFn - The async function to call to refresh data.
 *                               Receives `isBackground = true` for auto-refreshes.
 * @param {number} intervalMs - Polling interval in milliseconds (default: 10000 = 10s)
 */
export default function useRefresh(refreshFn, intervalMs = 10000) {
  const intervalRef = useRef(null);
  const refreshFnRef = useRef(refreshFn);

  // Keep the refresh function reference up to date
  useEffect(() => {
    refreshFnRef.current = refreshFn;
  }, [refreshFn]);

  // Handle visibility change - refresh when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Pass true for background refresh
        refreshFnRef.current?.(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Set up periodic polling
  useEffect(() => {
    if (intervalMs > 0) {
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          // Pass true for background refresh
          refreshFnRef.current?.(true);
        }
      }, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [intervalMs]);

  // Return a manual refresh function
  const forceRefresh = useCallback(() => {
    // Pass false for manual refresh (not background)
    refreshFnRef.current?.(false);
  }, []);

  return forceRefresh;
}
