import {
  AlignCenterVerticalIcon,
  AlignEndVerticalIcon,
  AlignHorizontalJustifyCenterIcon,
  AlignHorizontalJustifyEndIcon,
  AlignHorizontalJustifyStartIcon,
  AlignStartVerticalIcon,
  StretchHorizontalIcon,
  StretchVerticalIcon,
} from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";
import { ValueUnitInput } from "@/puck/components/value-unit-input";

import type { SegmentedOption } from "../../../../types";

import type { AlignItems, LayoutSubComponentProps } from "../../types";

const alignItemsOptions = [
  {
    title: "Start",
    value: "start",
    icon: AlignHorizontalJustifyStartIcon,
  },
  {
    title: "Center",
    value: "center",
    icon: AlignHorizontalJustifyCenterIcon,
  },
  {
    title: "End",
    value: "end",
    icon: AlignHorizontalJustifyEndIcon,
  },
  {
    title: "Stretch",
    value: "stretch",
    icon: StretchHorizontalIcon,
  },
] satisfies SegmentedOption<AlignItems>[];

const justifyItemsOptions = [
  { value: "start", icon: AlignStartVerticalIcon, title: "Start" },
  { value: "center", icon: AlignCenterVerticalIcon, title: "Center" },
  { value: "end", icon: AlignEndVerticalIcon, title: "End" },
  { value: "stretch", icon: StretchVerticalIcon, title: "Stretch" },
];

export const GridUiProps = ({
  values,
  update,
  resetProp,
}: LayoutSubComponentProps) => {
  return (
    <div className="flex flex-col space-y-2 group/flex">
      {/* --- COLUMNS --- */}
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="gridTemplateColumns"
          label="Columns"
          isModified={values.gridTemplateColumns !== undefined}
          onReset={() => resetProp("gridTemplateColumns")}
        />
        <ValueUnitInput
          name="gridTemplateColumns"
          value={values.gridTemplateColumns ?? ""}
          onChange={(newVal) =>
            update({ gridTemplateColumns: newVal ?? undefined })
          }
          placeholder="0"
          units={["fr"]}
          defaultUnit="fr"
        />
      </div>

      {/* --- ALIGNMENT --- */}
      <div className="mt-4">
        <span className="text-sm font-medium">Alignment</span>
        <div className="mt-2 flex flex-col gap-y-4 rounded bg-muted/60 p-2">
          {/* Justify Items */}
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="justifyItems"
              label="Justify items (X)"
              isModified={values.justifyItems !== undefined}
              onReset={() => resetProp("justifyItems")}
            />
            <SegmentedControl
              name="justifyItems"
              value={values.justifyItems ?? "stretch"}
              onChange={(val) => update({ justifyItems: val })}
              items={justifyItemsOptions}
            />
          </div>
          {/* Align Items */}
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="alignItems"
              label="Align items (Y)"
              isModified={values.alignItems !== undefined}
              onReset={() => resetProp("alignItems")}
            />
            <SegmentedControl
              name="alignItems"
              value={values.alignItems ?? "stretch"}
              onChange={(val) => update({ alignItems: val })}
              items={alignItemsOptions}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-sm font-medium">Gap</span>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="columnGap"
              label="Column Gap"
              isModified={values.columnGap !== undefined}
              onReset={() => resetProp("columnGap")}
            />
            <ValueUnitInput
              name="columnGap"
              value={values.columnGap ?? ""}
              onChange={(newVal) => update({ columnGap: newVal ?? undefined })}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="rowGap"
              label="Row Gap"
              isModified={values.rowGap !== undefined}
              onReset={() => resetProp("rowGap")}
            />
            <ValueUnitInput
              name="rowGap"
              value={values.rowGap ?? ""}
              onChange={(newVal) => update({ rowGap: newVal ?? undefined })}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
