import { RulerDimensionLineIcon } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";

export interface DimensionProps {
  width: string;
  height: string;
  maxWidth: string;
  minHeight: string;
  top: string;
  left: string;
  right: string;
  bottom: string;
  marginTop: string;
  marginLeft: string;
  marginRight: string;
  marginBottom: string;
  paddingTop: string;
  paddingLeft: string;
  paddingRight: string;
  paddingBottom: string;
}

const defaultDimension: DimensionProps = {
  width: "",
  height: "",
  maxWidth: "",
  minHeight: "",
  top: "",
  left: "",
  right: "",
  bottom: "",
  marginTop: "",
  marginLeft: "",
  marginRight: "",
  marginBottom: "",
  paddingTop: "",
  paddingLeft: "",
  paddingRight: "",
  paddingBottom: "",
};

type FieldDef = { key: keyof DimensionProps; label: string };

const layoutFields: FieldDef[] = [
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
  { key: "maxWidth", label: "Max width" },
  { key: "minHeight", label: "Min height" },
];

const marginFields: FieldDef[] = [
  { key: "marginTop", label: "Top" },
  { key: "marginRight", label: "Right" },
  { key: "marginBottom", label: "Bottom" },
  { key: "marginLeft", label: "Left" },
];

const paddingFields: FieldDef[] = [
  { key: "paddingTop", label: "Top" },
  { key: "paddingRight", label: "Right" },
  { key: "paddingBottom", label: "Bottom" },
  { key: "paddingLeft", label: "Left" },
];

export const DimensionField = withAccordionField(
  "Dimension",
  <RulerDimensionLineIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: DimensionProps) => void;
    value?: DimensionProps;
  }) => {
    const state = value || defaultDimension;

    const update = (updates: Partial<DimensionProps>) => {
      onChange({
        ...state,
        ...updates,
      });
    };

    const renderField = ({ key, label }: FieldDef) => (
      <div key={`container-${key}`} className="flex flex-col gap-y-1">
        <PropHeader
          key={`prop-${key}`}
          name={key}
          label={label}
          isModified={state[key] !== defaultDimension[key]}
          onReset={() => update({ [key]: defaultDimension[key] })}
        />
        <ValueUnitInput
          key={`value-${key}`}
          name={key}
          value={state[key]}
          onChange={(newVal) => update({ [key]: newVal })}
        />
      </div>
    );

    return (
      <>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-1">
          {layoutFields.map(renderField)}
        </div>

        {/* --- MARGIN --- */}
        <div className="mt-4">
          <span>Margin</span>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
            {marginFields.map(renderField)}
          </div>
        </div>
        {/* --- PADDING --- */}
        <div className="mt-4">
          <span>Padding</span>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
            {paddingFields.map(renderField)}
          </div>
        </div>
      </>
    );
  },
);
