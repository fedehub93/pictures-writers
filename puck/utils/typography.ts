import type { CSSProperties } from "react";
import { TypographyProps } from "../fields/typography";

export function getTypographyProps(typography?: TypographyProps) {
  if (!typography) return { className: "", style: {} };

  const fontSize = typography.fontSize;

  const letterSpacing = typography.letterSpacing;
  const lineHeight = typography.lineHeight;

  return {
    className: [
      typography.fontWeight,
      typography.fontFamily !== "inherit" ? typography.fontFamily : "",
      typography.textAlign ? `text-${typography.textAlign}` : "",
    ]
      .filter(Boolean)
      .join(" "),

    style: {
      fontSize: fontSize !== undefined ? `${fontSize}` : undefined,
      // Se è 0 possiamo anche ometterlo o generare "0px"
      letterSpacing:
        letterSpacing !== undefined ? `${letterSpacing}` : undefined,
      lineHeight: lineHeight || undefined,
    } as CSSProperties,
  };
}
