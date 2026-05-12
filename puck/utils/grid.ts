import { Responsive } from "@/puck/utils/responsive";
import { GridProps } from "@/puck/fields/grid";
import { generateResponsiveCss } from "./generate-responsive-css";

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
    baseStyles: "display: grid;", // <-- Iniettato automaticamente nel desktop base
    parseRules: (props) => {
      let cssRule = "";
      (Object.entries(props) as [keyof GridProps, string][]).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value.trim() !== "" && value !== "auto") {
          const cssKey = cssKeyMapping[key] || key;
          cssRule += `${cssKey}: ${value}; `;
        }
      });
      return cssRule;
    },
  });
}