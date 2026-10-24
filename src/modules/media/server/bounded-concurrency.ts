import "server-only";

/**
 * Runs `worker` over `items` with a fixed number of concurrent runners.
 * Media jobs touch Postgres and CPU-bound image processing, so an unbounded
 * `Promise.all` over the library would starve both.
 */
export async function forEachWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const limit = Math.max(1, Math.min(concurrency, items.length || 1));
  let cursor = 0;

  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
    }
  });

  await Promise.all(runners);
}
