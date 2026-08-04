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

import { SegmentedControl } from "@/puck/components/segmented-control";
import { PropHeader } from "@/puck/components/prop-header";
import { InputTextField } from "@/puck/components/text-field";

import type { SegmentedOption } from "../../../types";

import type { AlignItems, LayoutSubComponentProps } from "../types";

const alignItemsOptions = [
  // Nota: per alignItems le assegnazioni Row/Col sono invertite come avevamo stabilito
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
      <InputTextField
        key="gridTemplateColumns"
        name="gridTemplateColumns"
        label="Columns"
        placeholder="none"
        type="unit"
        units={["fr"]}
        defaultUnit="fr"
        currentValues={values}
        renderValues={values}
        resetProp={resetProp}
        update={update}
      />

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
          <InputTextField
            key="columnGap"
            name="columnGap"
            label="Column Gap"
            placeholder="0"
            type="unit"
            currentValues={values}
            renderValues={values}
            resetProp={resetProp}
            update={update}
          />
          <InputTextField
            key="rowGap"
            name="rowGap"
            label="Row Gap"
            placeholder="0"
            type="unit"
            currentValues={values}
            renderValues={values}
            resetProp={resetProp}
            update={update}
          />
        </div>
      </div>
    </div>
  );
};
