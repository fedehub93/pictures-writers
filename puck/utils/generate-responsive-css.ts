// puck/utils/generate-responsive-css.ts

import { Responsive } from "@/puck/utils/responsive";
import { BREAKPOINTS } from "@/puck/utils/breakpoints";

interface CssGeneratorOptions<T> {
  data: Responsive<T> | undefined;
  blockId: string;
  // Funzione che ogni singolo utility file passerà per tradurre le sue proprietà
  parseRules: (props: Partial<T>) => string; 
  // Stili di base opzionali (es. "display: grid;" per il blocco grid)
  baseStyles?: string; 
}

export function generateResponsiveCss<T>({
  data,
  blockId,
  parseRules,
  baseStyles = "",
}: CssGeneratorOptions<T>) {
  if (!data) return { className: "", cssString: "" };

  // 1. Facciamo parsare le regole alle funzioni specifiche
  const desktopCss = parseRules(data.desktop || {});
  const tabletCss = parseRules(data.tablet || {});
  const mobileCss = parseRules(data.mobile || {});

  // 2. Se non c'è nulla da stampare, usciamo
  if (!desktopCss && !tabletCss && !mobileCss && !baseStyles) {
    return { className: "", cssString: "" };
  }

  let finalCssString = "";

  // 3. Desktop / Base
  if (desktopCss || baseStyles) {
    finalCssString += `
      .${blockId} {
        ${baseStyles}
        ${desktopCss}
      }
    `;
  }

  // 4. Tablet
  if (tabletCss) {
    finalCssString += `
      @media (max-width: ${BREAKPOINTS.tablet.cssMaxWidth}px) {
        .${blockId} {
          ${tabletCss}
        }
      }
    `;
  }

  // 5. Mobile
  if (mobileCss) {
    finalCssString += `
      @media (max-width: ${BREAKPOINTS.mobile.cssMaxWidth}px) {
        .${blockId} {
          ${mobileCss}
        }
      }
    `;
  }

  return {
    className: blockId,
    cssString: finalCssString,
  };
}