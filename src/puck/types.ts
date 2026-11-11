import type { LucideProps } from "lucide-react";
import { ComponentType } from "react";

type FieldInputType = "text" | "unit";

/**
 * Puck's drag/selection ref, handed to a block that declares `inline: true`.
 *
 * Puck renders such a block without its wrapper `div`, so the block must attach
 * this to the element that is its root. It is `null` on the published page.
 */
export type BlockDragRef = ((element: Element | null) => void) | null;

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
