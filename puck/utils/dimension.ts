import { Responsive } from "@/puck/utils/responsive";
import { DimensionProps } from "@/puck/fields/dimension";
import { generateResponsiveCss } from "./generate-responsive-css";

const cssKeyMapping: Record<keyof DimensionProps, string> = {
  width: "width", height: "height", maxWidth: "max-width", minHeight: "min-height",
  top: "top", left: "left", right: "right", bottom: "bottom",
  marginTop: "margin-top", marginLeft: "margin-left", marginRight: "margin-right", marginBottom: "margin-bottom",
  paddingTop: "padding-top", paddingLeft: "padding-left", paddingRight: "padding-right", paddingBottom: "padding-bottom",
};

export function getDimensionProps(dimension: Responsive<DimensionProps> | undefined, blockId: string) {
  return generateResponsiveCss({
    data: dimension,
    blockId,
    parseRules: (props) => {
      let cssRule = "";
      (Object.entries(props) as [keyof DimensionProps, string][]).forEach(([key, value]) => {
        if (value && value !== "-" && value !== "") {
          cssRule += `${cssKeyMapping[key]}: ${value}; `;
        }
      });
      return cssRule;
    },
  });
}