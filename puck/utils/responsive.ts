import { Breakpoint } from "./breakpoints";

// "T" sarà l'oggetto delle proprietà (es. DimensionProps o TypographyProps)
export type Responsive<T> = {
  [key in Breakpoint]?: T;
};
