import { Breakpoint } from "./breakpoints";
import { Responsive } from "./responsive";

export function cascadeViewportValues<T>(
  viewportKey: Breakpoint,
  state: Responsive<T>,
  defaults: Record<Breakpoint, T>,
): T {
  const desktopData = state.desktop || {};
  const tabletData = state.tablet || {};
  const mobileData = state.mobile || {};

  if (viewportKey === "desktop") {
    return { ...defaults.desktop, ...desktopData } as T;
  } else if (viewportKey === "tablet") {
    return {
      ...defaults.tablet,
      ...desktopData,
      ...tabletData,
    } as T;
  } else {
    return {
      ...defaults.mobile,
      ...desktopData,
      ...tabletData,
      ...mobileData,
    } as T;
  }
}
