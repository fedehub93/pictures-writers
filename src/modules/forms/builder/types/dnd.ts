import { ElementsType, LayoutsType, DisplayType } from "./core";

export type DragData = {
  type: ElementsType | LayoutsType | DisplayType;
  isDesignerBtnElement: boolean;
};

export const isDragData = (data: unknown): data is DragData => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.type === "string" && typeof d.isDesignerBtnElement === "boolean"
  );
};

export enum DropAreaZone {
  ROOT = "Root",
  GRID = "Grid",
}
export type DropAreaType = DropAreaZone.ROOT | DropAreaZone.GRID;

export type DesignerWrapperData = {
  id: string | "root";
  isDesignerBtnElement: boolean;
  type: ElementsType | LayoutsType | DisplayType;
  area: DropAreaType;
};

export const isDesignerWrapperData = (
  data: unknown,
): data is DesignerWrapperData => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.isDesignerBtnElement === "boolean" &&
    typeof d.type === "string" &&
    typeof d.area === "string"
  );
};

export type GenericData = {
  id: string | "root";
  area: DropAreaType;
};

export const isGenericData = (data: unknown): data is GenericData => {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.id === "string" && typeof d.area === "string";
};
