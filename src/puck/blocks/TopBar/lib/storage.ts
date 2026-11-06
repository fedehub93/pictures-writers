const STORAGE_PREFIX = "puck:top-bar:dismissed:";

type Listener = () => void;

/**
 * Same-tab subscribers per storage key. The `storage` event only fires in
 * *other* tabs, so `dismissTopBar` also notifies these listeners directly.
 */
const listeners = new Map<string, Set<Listener>>();

/**
 * Local storage key used to remember that a visitor dismissed a Top bar.
 *
 * The block id is the whole scope: a dismissed bar stays dismissed even when
 * its content changes, so the same strip does not reappear for returning
 * visitors after an editor rewrites one of its links.
 */
export function getTopBarStorageKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`;
}

function getStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    return window.localStorage;
  } catch {
    // Browsers can disable storage (private mode, cookie policy); a failed
    // lookup must never crash the header.
    return undefined;
  }
}

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

export function isTopBarDismissed(id: string): boolean {
  return getStorage()?.getItem(getTopBarStorageKey(id)) === "true";
}

/**
 * Subscribe to the dismissal state of one Top bar.
 *
 * `subscribeToTopBar` keeps the hook in `ui/top-bar.tsx` in sync with storage
 * changes coming from another tab or from this one.
 */
export function subscribeToTopBar(
  id: string,
  listener: Listener,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const key = getTopBarStorageKey(id);

  let subscribers = listeners.get(key);
  if (!subscribers) {
    subscribers = new Set();
    listeners.set(key, subscribers);
  }
  subscribers.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === key) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0) listeners.delete(key);
    window.removeEventListener("storage", onStorage);
  };
}

export function dismissTopBar(id: string): void {
  const key = getTopBarStorageKey(id);

  getStorage()?.setItem(key, "true");
  notify(key);
}
