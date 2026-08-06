import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";

import type { SegmentedOption } from "@/puck/types";

import type { LayoutProps } from "../../index";
import type { DisplayType } from "../../types";

import { FlexProps } from "../components/flex-props";
import { GridUiProps } from "../components/grid-props";

const displayOptions = [
  { title: "Block", value: "block" },
  { title: "Flex", value: "flex" },
  { title: "Grid", value: "grid" },
  { title: "None", value: "none" },
] satisfies SegmentedOption<DisplayType>[];

const PropsComponents = {
  block: undefined,
  flex: FlexProps,
  grid: GridUiProps,
  none: undefined,
};

interface LayoutViewProps {
  currentValues: Partial<LayoutProps>;
  renderValues: LayoutProps;
  resetProp: (key: keyof LayoutProps) => void;
  onUpdateDisplay: (display: DisplayType) => void;
  onUpdate: (values: Partial<LayoutProps>) => void;
}

export const LayoutView = ({
  currentValues,
  renderValues,
  resetProp,
  onUpdateDisplay,
  onUpdate,
}: LayoutViewProps) => {
  const currentDisplay = renderValues.display ?? "block";
  const PropsComponent =
    PropsComponents[currentDisplay as keyof typeof PropsComponents];

  return (
    <div className="flex flex-col space-y-2 p-1">
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="display"
          label="Display"
          isModified={currentValues.display !== undefined}
          onReset={() => resetProp("display")}
        />
        <SegmentedControl
          name="display"
          value={currentDisplay}
          onChange={(newVal) => onUpdateDisplay(newVal || undefined)}
          items={displayOptions}
        />
      </div>

      <div>
        {PropsComponent && (
          <PropsComponent
            values={renderValues}
            update={onUpdate}
            resetProp={resetProp}
          />
        )}
      </div>
    </div>
  );
};
