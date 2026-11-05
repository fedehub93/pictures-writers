const STORAGE_PREFIX = "puck:announcement-bar:dismissed:";

type Listener = () => void;

/**
 * Same-tab subscribers per storage key. The `storage` event only fires in
 * *other* tabs, so `dismissAnnouncement` also notifies these listeners directly.
 */
const listeners = new Map<string, Set<Listener>>();

function hashContent(content: string): string {
  // Small deterministic hash (djb2). The goal is only to change the dismissal
  // key when the banner copy changes, so a new announcement is not hidden for
  // every returning visitor who closed the previous one.
  let hash = 5381;

  for (let index = 0; index < content.length; index += 1) {
    hash = (hash * 33) ^ content.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

/**
 * Local storage key used to remember that a visitor dismissed an announcement
 * bar. The block id keeps multiple bars independent; the content hash makes a
 * reworded announcement visible again. The prefix avoids clashing with keys
 * owned by the rest of the site.
 */
export function getAnnouncementStorageKey(
  id: string,
  content: string,
): string {
  return `${STORAGE_PREFIX}${id}:${hashContent(content)}`;
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

export function isAnnouncementDismissed(
  id: string,
  content: string,
): boolean {
  return getStorage()?.getItem(getAnnouncementStorageKey(id, content)) === "true";
}

/**
 * Subscribe to the dismissal state of one announcement.
 *
 * `subscribeToAnnouncement` keeps the hook in `ui/announcement-bar.tsx` in sync
 * with storage changes coming from another tab or from this one.
 */
export function subscribeToAnnouncement(
  id: string,
  content: string,
  listener: Listener,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const key = getAnnouncementStorageKey(id, content);

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

export function dismissAnnouncement(id: string, content: string): void {
  const key = getAnnouncementStorageKey(id, content);

  getStorage()?.setItem(key, "true");
  notify(key);
}
