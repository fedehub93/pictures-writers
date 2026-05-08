import { type Slot, type ComponentConfig } from "@puckeditor/core";
import { ColumnsIcon, RowsIcon, RulerDimensionLineIcon } from "lucide-react";

export type GridProps = {
  numberOfColumns: number;
  numberOfRows: number;
  gap: number;
  custom: string;
  items: Slot;
};

export const Grid: ComponentConfig<GridProps> = {
  fields: {
    numberOfColumns: {
      type: "number",
      label: "Number of Columns",
      min: 1,
      max: 12,
      labelIcon: <ColumnsIcon className="size-4" />,
    },
    numberOfRows: {
      type: "number",
      label: "Number of Rows",
      min: 1,
      labelIcon: <RowsIcon className="size-4" />,
    },
    gap: {
      type: "number",
      label: "Gap",
      min: 0,
      labelIcon: <RulerDimensionLineIcon className="size-4" />,
    },
    custom: {
      type: "custom",
      render: () => {
        return (
          <div className="p-2 bg-muted rounded">
            <p className="text-sm text-foreground/80">
              This is a custom field. You can use it to store any data you want.
            </p>
          </div>
        );
      },
    },
    items: {
      type: "slot",
    },
  },
  defaultProps: {
    numberOfColumns: 1,
    numberOfRows: 1,
    gap: 16,
    custom: "",
    items: [],
  },
  render: ({ numberOfColumns, numberOfRows, gap, items: Items }) => {
    return (
      <div>
        <Items
          style={{
            gap: gap,
            gridTemplateColumns: `repeat(${numberOfColumns}, 1fr)`,
            gridTemplateRows: `repeat(${numberOfRows}, 1fr)`,
          }}
        ></Items>
      </div>
    );
  },
};
