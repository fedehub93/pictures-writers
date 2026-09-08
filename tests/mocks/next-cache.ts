// Stub for next/cache so modules that call on-demand revalidation (see
// src/shared/lib/revalidate-content.ts, ADR-0001) can be unit tested outside
// of the Next.js runtime. revalidatePath/revalidateTag are no-ops in tests.
export function revalidatePath(): void {}
export function revalidateTag(): void {}
export function unstable_cache<Args extends unknown[], Value>(
  cb: (...args: Args) => Promise<Value>,
): (...args: Args) => Promise<Value> {
  return cb;
}
