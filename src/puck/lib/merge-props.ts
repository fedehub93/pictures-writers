/**
 * Apply a block's default props to the props the public render receives.
 *
 * Puck merges `defaultProps` with a shallow spread (`{ ...defaultProps,
 * ...props }`) and only in the editor canvas: the public `<Render>` receives
 * the saved props as-is. Mirroring that shallow spread here is what makes the
 * two paths agree. A deeper merge would restore a nested default the canvas has
 * already replaced — for example a per-breakpoint typography default dropped by
 * an authored `typography` object — and the canvas would start lying again.
 */
export const mergePropsWithDefaults = <P extends object>(
  defaults: object,
  props: P,
): P => ({ ...defaults, ...props }) as P;
