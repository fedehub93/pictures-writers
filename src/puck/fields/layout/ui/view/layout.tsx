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
  showContainerControls?: boolean;
  /**
   * Whether the display control offers `none`. Leaf blocks keep it for
   * responsive visibility; the root variant turns it off.
   */
  allowHidden?: boolean;
}

export const LayoutView = ({
  currentValues,
  renderValues,
  resetProp,
  onUpdateDisplay,
  onUpdate,
  showContainerControls = true,
  allowHidden = true,
}: LayoutViewProps) => {
  const currentDisplay = renderValues.display ?? "block";
  const PropsComponent = showContainerControls
    ? PropsComponents[currentDisplay as keyof typeof PropsComponents]
    : undefined;
  const isHidden = renderValues.display === "none";
  const availableOptions = allowHidden
    ? displayOptions
    : displayOptions.filter((option) => option.value !== "none");

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
          items={availableOptions}
        />
      </div>

      {isHidden ? (
        <div
          role="status"
          className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 p-2 text-xs text-muted-foreground"
        >
          <p className="font-medium text-foreground">
            Hidden at the current viewport
          </p>
          <p className="mt-1">
            The public site removes this block; the canvas keeps a placeholder
            so you can still select and edit it.
          </p>
        </div>
      ) : null}

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
