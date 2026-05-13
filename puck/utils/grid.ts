// puck/utils/get-grid-props.ts

import { Responsive } from "@/puck/utils/responsive";
import { GridProps } from "@/puck/fields/grid";
import { generateResponsiveCss } from "./generate-responsive-css";

// Mappatura per tradurre le chiavi dal formato camelCase (field) a kebab-case (CSS)
const cssKeyMapping: Record<keyof GridProps, string> = {
  columns: "grid-template-columns",
  gap: "gap",
  alignItems: "align-items",
  justifyItems: "justify-items",
};

export function getGridProps(grid: Responsive<GridProps> | undefined, blockId: string) {
  return generateResponsiveCss({
    data: grid,
    blockId,
    // Iniettiamo display: grid come base per rendere il blocco effettivamente una griglia
    baseStyles: "display: grid;", 
    parseRules: (props) => {
      let cssRule = "";

      // Iteriamo sulle entries specificando che il valore può essere string o undefined
      (Object.entries(props) as [keyof GridProps, string | undefined][]).forEach(([key, value]) => {
        // Filtriamo valori nulli, undefined, stringhe vuote o placeholder non validi
        if (
          value !== undefined && 
          value !== null && 
          value.trim() !== "" && 
          value !== "auto" // Manteniamo il tuo filtro per ignorare "auto" se desiderato
        ) {
          const cssKey = cssKeyMapping[key] || key;
          cssRule += `${cssKey}: ${value}; `;
        }
      });

      return cssRule;
    },
  });
}