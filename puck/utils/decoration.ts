// puck/utils/decoration.ts

import { Responsive } from "@/puck/utils/responsive";
import { DecorationProps } from "@/puck/fields/decoration";
import { generateResponsiveCss } from "./generate-responsive-css";

// Mappatura dal camelCase del field al kebab-case del CSS puro
const cssKeyMapping: Record<keyof DecorationProps, string> = {
  opacity: "opacity",
  borderTopLeftRadius: "border-top-left-radius",
  borderTopRightRadius: "border-top-right-radius",
  borderBottomLeftRadius: "border-bottom-left-radius",
  borderBottomRightRadius: "border-bottom-right-radius",
};

export function getDecorationProps(
  decoration: Responsive<DecorationProps> | undefined,
  blockId: string,
) {
  return generateResponsiveCss({
    data: decoration,
    blockId,
    parseRules: (props) => {
      let cssRule = "";

      // Castiamo esplicitamente a string | undefined per gestire il JSON leggero
      (Object.entries(props) as [keyof DecorationProps, string | undefined][]).forEach(
        ([key, value]) => {
          // Filtriamo: deve essere definito, non nullo, non una stringa vuota o un placeholder
          if (
            value !== undefined &&
            value !== null &&
            value.trim() !== "" &&
            value !== "-"
          ) {
            const cssKey = cssKeyMapping[key];
            
            // Sicurezza: procediamo solo se la chiave è mappata correttamente
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