import { TypographyProps } from "../fields/typography";

export function getTypographyProps(typography?: TypographyProps) {
  if (!typography) return { className: "", style: {} };

  const fontSize = typography.fontSize;
  const fontUnit = typography.fontSizeUnit || "px";

  const letterSpacing = typography.letterSpacing;
  const letterUnit = typography.letterSpacingUnit || "px";

  return {
    className: [
      typography.fontWeight,
      typography.fontFamily !== "inherit" ? typography.fontFamily : "",
      typography.textAlign ? `text-${typography.textAlign}` : "",
    ]
      .filter(Boolean)
      .join(" "),

    style: {
      fontSize: fontSize !== undefined ? `${fontSize}${fontUnit}` : undefined,
      // Se è 0 possiamo anche ometterlo o generare "0px"
      letterSpacing:
        letterSpacing !== undefined
          ? `${letterSpacing}${letterUnit}`
          : undefined,
    } as React.CSSProperties,
  };
}
