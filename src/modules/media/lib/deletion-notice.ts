import type { MediaDeletionCleanup } from "@/modules/media/types";

function storedObjects(count: number): string {
  return count === 1
    ? "1 stored object was"
    : `${count} stored objects were`;
}

/**
 * The sentence an admin sees when a permanent deletion removed the rows but
 * left some objects in storage, or `null` when every object was removed. A
 * skipped object is not an error: its driver is not configured here, so the
 * deletion cannot address it, and the admin must know it stayed behind.
 */
export function mediaDeletionCleanupNotice(
  cleanup: MediaDeletionCleanup[],
): string | null {
  const skipped = cleanup.filter((entry) => entry.status === "skipped").length;
  const failed = cleanup.filter((entry) => entry.status === "failed").length;

  if (skipped === 0 && failed === 0) return null;

  const notes: string[] = [];

  if (skipped > 0) {
    notes.push(
      `${storedObjects(skipped)} left in place because the provider that owns ${
        skipped === 1 ? "it" : "them"
      } is not configured on this installation`,
    );
  }

  if (failed > 0) {
    notes.push(`${storedObjects(failed)} not removed from storage`);
  }

  return `${notes.join(", and ")}.`;
}
