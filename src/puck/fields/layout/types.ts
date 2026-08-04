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

export interface LayoutProps {
  display?: DisplayType;
  flexDirection?: FlexDirection;
  flexWrap?: string;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  alignContent?: string;
  justifyItems?: string;
  alignSelf?: string;
  rowGap?: string;
  columnGap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  // gridColumn?: string;
  // gridRow?: string;
  // order?: string | number;
  // flexGrow?: string | number;
  // flexShrink?: string | number;
  // flexBasis?: string;
}

export interface LayoutSubComponentProps {
  values: Partial<LayoutProps>;
  update: (updates: Partial<LayoutProps>) => void;
  resetProp: (key: keyof LayoutProps) => void;
}
