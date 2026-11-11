import type { LucideProps } from "lucide-react";
import { ComponentType } from "react";

type FieldInputType = "text" | "unit";

/**
 * Puck's drag/selection ref, handed to a block that declares `inline: true`.
 *
 * Puck renders such a block without its wrapper `div`, so the block must attach
 * this to the element that is its root: the node the editor selects, drags and
 * outlines, and the box the parent lays out. It is `null` on the published
 * page, so the same render function serves both paths.
 *
 * The ref belongs on the element that also carries the block's root classes
 * (`puck-dim`, plus `puck-layout` for the container blocks). Putting it on a
 * child, or on a wrapper the block renders for its own layout, makes the
 * editor select a box that the published page does not have.
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
