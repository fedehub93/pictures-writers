// puck/utils/dimension.ts

import { Responsive } from "@/puck/utils/responsive";
import { DimensionProps } from "@/puck/fields/dimension";
import { generateResponsiveCss } from "./generate-responsive-css";

const cssKeyMapping: Record<keyof DimensionProps, string> = {
  width: "width",
  height: "height",
  maxWidth: "max-width",
  minHeight: "min-height",
  aspectRatio: "aspect-ratio",
  top: "top",
  left: "left",
  right: "right",
  bottom: "bottom",
  marginTop: "margin-top",
  marginLeft: "margin-left",
  marginRight: "margin-right",
  marginBottom: "margin-bottom",
  paddingTop: "padding-top",
  paddingLeft: "padding-left",
  paddingRight: "padding-right",
  paddingBottom: "padding-bottom",
};

export function getDimensionProps(
  dimension: Responsive<DimensionProps> | undefined,
  blockId: string,
) {
  return generateResponsiveCss({
    data: dimension,
    blockId,
    parseRules: (props) => {
      let cssRule = "";

      // Utilizziamo Object.entries per iterare sulle proprietà definite
      (Object.entries(props) as [keyof DimensionProps, string | undefined][]).forEach(
        ([key, value]) => {
          // Gestiamo il valore: deve esistere, non essere una stringa vuota 
          // e non essere il placeholder "-"
          if (value !== undefined && value !== null && value.trim() !== "" && value !== "-") {
            const cssKey = cssKeyMapping[key];
            
            // Sicurezza aggiuntiva: se per qualche motivo la chiave non è in mappa, 
            // evitiamo di rompere il CSS
            if (cssKey) {
              cssRule += `${cssKey}: ${value}; `;
            }
          }
        },
      );
      
      return cssRule;
    },
  });
}