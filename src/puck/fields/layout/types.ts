import type { LayoutProps } from "./index";

export type DisplayType = "block" | "flex" | "grid" | "none";
export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type JustifyContent =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";
export type AlignItems = "start" | "center" | "end" | "stretch";

export interface LayoutSubComponentProps {
  values: Partial<LayoutProps>;
  update: (updates: Partial<LayoutProps>) => void;
  resetProp: (key: keyof LayoutProps) => void;
}
