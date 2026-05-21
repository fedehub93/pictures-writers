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
      // Sovrapponiamo solo le proprietà che sono effettivamente definite (non undefined)
      Object.entries(data).forEach(([propKey, propValue]) => {
        if (propValue !== undefined) {
          (result as any)[propKey] = propValue;
        }
      });
    }
  }

  return result;
}
