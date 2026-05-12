import { Responsive } from "@/puck/utils/responsive";
import { TypographyProps } from "@/puck/fields/typography";
import { generateResponsiveCss } from "./generate-responsive-css";

const fontWeightMap: Record<string, string> = {
  "font-light": "300",
  "font-normal": "400",
  "font-medium": "500",
  "font-bold": "700",
};

export function getTypographyProps(typography: Responsive<TypographyProps> | undefined, blockId: string) {
  return generateResponsiveCss({
    data: typography,
    blockId,
    parseRules: (props) => {
      let cssRule = "";

      if (props.fontSize) cssRule += `font-size: ${props.fontSize}; `;
      if (props.letterSpacing) cssRule += `letter-spacing: ${props.letterSpacing}; `;
      if (props.lineHeight) cssRule += `line-height: ${props.lineHeight}; `;
      
      if (props.fontWeight) {
        cssRule += `font-weight: ${fontWeightMap[props.fontWeight] || props.fontWeight}; `;
      }
      if (props.textAlign) cssRule += `text-align: ${props.textAlign}; `;
      if (props.fontFamily && props.fontFamily !== "inherit") {
        cssRule += `font-family: ${props.fontFamily}; `;
      }

      return cssRule;
    },
  });
}