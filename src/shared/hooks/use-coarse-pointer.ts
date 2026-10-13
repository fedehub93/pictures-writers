import * as React from "react"

const COARSE_POINTER_QUERY = "(pointer: coarse)"

const subscribe = (onStoreChange: () => void) => {
  const mql = window.matchMedia(COARSE_POINTER_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

const getSnapshot = () => window.matchMedia(COARSE_POINTER_QUERY).matches

/**
 * Whether the device's primary input is a coarse pointer (a finger, not a
 * mouse or trackpad). Used to keep imprecise touch resizing off the dashboard
 * while leaving pointer interactions available.
 *
 * Reads through `useSyncExternalStore`, so the server snapshot (and the first
 * client render) is `false` and the value resolves on the client without a
 * hydration mismatch or a set-state-in-effect.
 */
export function useIsCoarsePointer() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
