import { useId } from "react";
import { cn } from "@/lib/utils";
import { type Slot, type ComponentConfig } from "@puckeditor/core";

// Importiamo il tipo Responsive
import { Responsive } from "@/puck/utils/responsive";

import { GridField, GridProps } from "@/puck/fields/grid";
import { DimensionField, DimensionProps } from "@/puck/fields/dimension";
import { TypographyField, TypographyProps } from "@/puck/fields/typography";

import { getGridProps } from "@/puck/utils/grid";
import { getDimensionProps } from "@/puck/utils/dimension";
import { getTypographyProps } from "@/puck/utils/typography";

// 1. Aggiorniamo le prop per utilizzare il wrapper Responsive
export type GridBlockProps = {
  grid?: Responsive<GridProps>;
  dimension?: Responsive<DimensionProps>;
  typography?: Responsive<TypographyProps>;
  items: Slot;
};

export const GridBlock: ComponentConfig<GridBlockProps> = {
  fields: {
    grid: GridField,
    dimension: DimensionField,
    typography: TypographyField,
    items: {
      type: "slot",
    },
  },
  defaultProps: {
    items: [],
  },
  render: ({ grid, dimension, typography, items: Items }) => {
    // 2. Generiamo un ID univoco per questo specifico blocco
    // Rimuoviamo i due punti (:) generati da useId() perché rompono i selettori CSS
    const rawId = useId().replace(/:/g, "");
    const blockClass = `puck-grid-${rawId}`;

    // 3. Passiamo la classe univoca alle nostre utility functions
    const gridData = getGridProps(grid, blockClass);
    const dimensionData = getDimensionProps(dimension, blockClass);
    const typoData = getTypographyProps(typography, blockClass);

    // 4. Combiniamo tutte le stringhe CSS generate
    const combinedCss = `
      ${gridData.cssString || ""}
      ${dimensionData.cssString || ""}
      ${typoData.cssString || ""}
      `;

    return (
      <>
        {/* 5. Iniettiamo le Media Queries nel DOM (solo se c'è effettivamente del CSS) */}
        {combinedCss.trim() !== "" && <style>{combinedCss}</style>}
        {/* 6. Renderizziamo lo Slot applicando la nostra classe dinamica e rimuovendo style={{}} */}
        <Items
          className={cn(
            "grid", // La tua classe base di tailwind
            blockClass, // La classe dinamica che collega il div alle media queries generate sopra
            // Se le utility ritornano anche delle classi statiche, le aggiungiamo qui
            gridData.className !== blockClass ? gridData.className : "",
            dimensionData.className !== blockClass
              ? dimensionData.className
              : "",
            typoData.className !== blockClass ? typoData.className : "",
          )}
        />
      </>
    );
  },
};
