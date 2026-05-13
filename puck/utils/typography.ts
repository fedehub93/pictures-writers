import { Responsive } from "@/puck/utils/responsive";
import { TypographyProps } from "@/puck/fields/typography";
import { generateResponsiveCss } from "./generate-responsive-css";

// 1. Mappa per i pesi dei font
const fontWeightMap: Record<string, string> = {
  "font-light": "300",
  "font-normal": "400",
  "font-medium": "500",
  "font-bold": "700",
};

// 2. Mappa delle chiavi CSS
const cssKeyMapping: Record<keyof TypographyProps, string> = {
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  letterSpacing: "letter-spacing",
  lineHeight: "line-height",
  textAlign: "text-align",
};

export function getTypographyProps(
  typography: Responsive<TypographyProps> | undefined,
  blockId: string,
) {
  return generateResponsiveCss({
    data: typography,
    blockId,
    parseRules: (props) => {
      let cssRule = "";

      (Object.entries(props) as [keyof TypographyProps, string | undefined][]).forEach(
        ([key, value]) => {
          // Validazione base: valore presente, non vuoto e non placeholder
          if (value !== undefined && value !== null && value.trim() !== "" && value !== "-") {
            
            // Logica specifica per il FontFamily: ignoriamo "inherit"
            if (key === "fontFamily" && value === "inherit") return;

            const cssKey = cssKeyMapping[key];

            if (cssKey) {
              let finalValue = value;

              // Logica specifica per il FontWeight: mappiamo se necessario
              if (key === "fontWeight") {
                finalValue = fontWeightMap[value] || value;
              }

              cssRule += `${cssKey}: ${finalValue}; `;
            }
          }
        },
      );

      return cssRule;
    },
  });
}