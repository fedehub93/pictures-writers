import type { LucideIcon } from "lucide-react";

export type ObjectFitType =
  | "fill"
  | "contain"
  | "cover"
  | "none"
  | "scale-down";
export type LoadingType = "lazy" | "eager";

export type FitOptionsType = {
  label: string;
  value: ObjectFitType;
};

export type LoadingOptionsType = {
  title: string;
  value: LoadingType;
  icon: LucideIcon;
};
