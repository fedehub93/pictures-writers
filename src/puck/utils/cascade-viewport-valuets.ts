// puck/utils/cascade-viewport-values.ts

import { Breakpoint } from "./breakpoints";
import { Responsive } from "./responsive";

export function cascadeViewportValues<T extends object>(
  viewportKey: Breakpoint,
  state: Responsive<T>,
  defaults: Record<Breakpoint, T>,
): T {
  // Creiamo un oggetto base partendo dai default del breakpoint corrente
  const result = { ...defaults[viewportKey] } as T;

  // Definiamo l'ordine della cascata (Desktop -> Tablet -> Mobile)
  const breakpoints: Breakpoint[] = ["desktop", "tablet", "mobile"];
  const currentIndex = breakpoints.indexOf(viewportKey);

  // Iteriamo attraverso i breakpoint fino a quello corrente
  for (let i = 0; i <= currentIndex; i++) {
    const key = breakpoints[i];
    const data = state[key];

    if (data) {
      (Object.keys(data) as Array<keyof T>).forEach((propKey) => {
        const propValue = data[propKey];

        if (propValue !== undefined) {
          result[propKey] = propValue as T[keyof T];
        }
      });
    }
  }

  return result;
}
