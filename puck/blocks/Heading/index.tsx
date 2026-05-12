import { ReactNode, useId } from "react";
import { ComponentConfig } from "@puckeditor/core";

import { cn } from "@/lib/utils";

// Importiamo il wrapper Responsive
import { Responsive } from "@/puck/utils/responsive";

import { RichTextField } from "@/puck/fields/rich-text";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";
import { getDimensionProps } from "@/puck/utils/dimension";
import { getTypographyProps } from "@/puck/utils/typography";

// 1. Aggiorniamo i tipi con il wrapper Responsive (il testo non serve, è contenuto globale)
export type HeadingProps = {
  text?: ReactNode;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
};

export const Heading: ComponentConfig<HeadingProps> = {
  fields: {
    text: RichTextField,
    dimension: DimensionField,
    typography: TypographyField,
  },
  defaultProps: {
    text: "Heading",
  },
  render: ({ text, dimension, typography }) => {
    // 2. Generiamo l'ID univoco per questo specifico heading
    const rawId = useId().replace(/:/g, "");
    const blockClass = `puck-heading-${rawId}`;

    // 3. Richiamiamo le utility passando la classe generata
    const dimensionData = getDimensionProps(dimension, blockClass);
    const typoData = getTypographyProps(typography, blockClass);

    // 4. Combiniamo le stringhe CSS
    const combinedCss = `
      ${dimensionData.cssString || ""}
      ${typoData.cssString || ""}
    `;

    return (
      <>
        {/* 5. Iniettiamo le Media Queries se presenti */}
        {combinedCss.trim() !== "" && <style>{combinedCss}</style>}
        {/* 6. Renderizziamo il tag, sostituendo style={{ display: "block" }} con la classe "block" */}
        <span
          className={cn(
            "block", // La struttura base
            blockClass, // Il collegamento dinamico al CSS
            // Aggiungiamo eventuali classi statiche ritornate dalle utility
            dimensionData.className !== blockClass
              ? dimensionData.className
              : "",
            typoData.className !== blockClass ? typoData.className : "",
          )}
        >
          {text}
        </span>
      </>
    );
  },
};
