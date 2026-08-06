import {
  AlignHorizontalJustifyCenterIcon,
  AlignHorizontalJustifyEndIcon,
  AlignHorizontalJustifyStartIcon,
  AlignHorizontalSpaceAroundIcon,
  AlignHorizontalSpaceBetweenIcon,
  AlignVerticalJustifyCenterIcon,
  AlignVerticalJustifyEndIcon,
  AlignVerticalJustifyStartIcon,
  AlignVerticalSpaceAroundIcon,
  AlignVerticalSpaceBetweenIcon,
  LucideProps,
  MoveDownIcon,
  MoveLeftIcon,
  MoveRightIcon,
  MoveUpIcon,
} from "lucide-react";

import { SegmentedControl } from "@/puck/components/segmented-control";
import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";

import type { SegmentedOption } from "../../../../types";

import type {
  AlignItems,
  FlexDirection,
  JustifyContent,
  LayoutSubComponentProps,
} from "../../types";

import { MorphIcon } from "./morph-icon";

// Le opzioni della direction restano statiche
const flexDirectionOptions = [
  { title: "Row", value: "row", icon: MoveRightIcon },
  { title: "Column", value: "column", icon: MoveDownIcon },
  { title: "Row Reverse", value: "row-reverse", icon: MoveLeftIcon },
  { title: "Column Reverse", value: "column-reverse", icon: MoveUpIcon },
] satisfies SegmentedOption<FlexDirection>[];

const justifyContentOptions = [
  {
    title: "Start",
    value: "start",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignHorizontalJustifyStartIcon}
        IconCol={AlignVerticalJustifyStartIcon}
        {...props}
      />
    ),
  },
  {
    title: "Center",
    value: "center",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignHorizontalJustifyCenterIcon}
        IconCol={AlignVerticalJustifyCenterIcon}
        {...props}
      />
    ),
  },
  {
    title: "End",
    value: "end",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignHorizontalJustifyEndIcon}
        IconCol={AlignVerticalJustifyEndIcon}
        {...props}
      />
    ),
  },
  {
    title: "Space Between",
    value: "space-between",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignHorizontalSpaceBetweenIcon}
        IconCol={AlignVerticalSpaceBetweenIcon}
        {...props}
      />
    ),
  },
  {
    title: "Space Around",
    value: "space-around",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignHorizontalSpaceAroundIcon}
        IconCol={AlignVerticalSpaceAroundIcon}
        {...props}
      />
    ),
  },
  {
    title: "Space Evenly",
    value: "space-evenly",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignHorizontalSpaceBetweenIcon}
        IconCol={AlignVerticalSpaceBetweenIcon}
        {...props}
      />
    ),
  },
] satisfies SegmentedOption<JustifyContent>[];

const alignItemsOptions = [
  // Nota: per alignItems le assegnazioni Row/Col sono invertite come avevamo stabilito
  {
    title: "Start",
    value: "start",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignVerticalJustifyStartIcon}
        IconCol={AlignHorizontalJustifyStartIcon}
        {...props}
      />
    ),
  },
  {
    title: "Center",
    value: "center",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignVerticalJustifyCenterIcon}
        IconCol={AlignHorizontalJustifyCenterIcon}
        {...props}
      />
    ),
  },
  {
    title: "End",
    value: "end",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignVerticalJustifyEndIcon}
        IconCol={AlignHorizontalJustifyEndIcon}
        {...props}
      />
    ),
  },
  {
    title: "Stretch",
    value: "stretch",
    icon: (props: LucideProps) => (
      <MorphIcon
        IconRow={AlignVerticalSpaceBetweenIcon}
        IconCol={AlignHorizontalSpaceBetweenIcon}
        {...props}
      />
    ),
  },
] satisfies SegmentedOption<AlignItems>[];

export const FlexProps = ({
  values,
  update,
  resetProp,
}: LayoutSubComponentProps) => {
  const currentDirection = values.flexDirection ?? "row";
  const isColumn = currentDirection.startsWith("column");

  return (
    <div
      className="flex flex-col space-y-2 group/flex"
      data-direction={isColumn ? "col" : "row"}
    >
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="direction"
          label="Direction"
          isModified={values.flexDirection !== undefined}
          onReset={() => resetProp("flexDirection")}
        />
        <SegmentedControl
          name="direction"
          value={currentDirection}
          onChange={(val) => update({ flexDirection: val })}
          items={flexDirectionOptions}
        />
      </div>
      <div className="mt-4">
        <span className="text-sm font-medium">Alignment</span>
        <div className="mt-2 flex flex-col gap-y-4 rounded bg-muted/60 p-2">
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="justifyContent"
              label="Justify Content"
              isModified={values.justifyContent !== undefined}
              onReset={() => resetProp("justifyContent")}
            />
            <SegmentedControl
              name="justifyContent"
              value={values.justifyContent ?? "start"}
              onChange={(val) => update({ justifyContent: val })}
              items={justifyContentOptions}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="alignItems"
              label="Align Items"
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
