import type { LucideProps } from "lucide-react";
import { ComponentType } from "react";

type FieldInputType = "text" | "unit";

export type FieldDef<T> = {
  key: keyof T;
  label: string;
  placeholder?: string;
  type?: FieldInputType;
  units?: string[];
};

export type SegmentedOption<T> = {
  title: string;
  value: T;
  icon?: ComponentType<LucideProps>;
};
