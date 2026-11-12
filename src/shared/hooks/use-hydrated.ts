"use client";

import { useSyncExternalStore } from "react";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False during SSR and the hydration render, true once the client has taken
 * over. Replaces the `useState(false)` + `useEffect(() => setMounted(true))`
 * mount guard, which React's `set-state-in-effect` rule rejects because it
 * schedules an extra render from an effect.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
