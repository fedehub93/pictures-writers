import { Breakpoint } from "./breakpoints";

// "T" sarà l'oggetto delle proprietà (es. SizeProps o TypographyProps)
export type Responsive<T> = {
  [key in Breakpoint]?: T;
};
