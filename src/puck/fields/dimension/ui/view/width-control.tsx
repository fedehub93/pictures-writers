import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import {
  FILL_WIDTH,
  normalizeAuthoredWidth,
} from "@/puck/utils/get-style-vars";

const WIDTH_FIELD = "width";
const FIT_CONTENT_WIDTH = "fit-content";

type WidthStateName = "auto" | "fill" | "fit";
type WidthState = WidthStateName | "custom";

/**
 * The named states the control can store. "Auto" is the empty value, so
 * clearing a field and picking Auto stay the same operation — the stored prop
 * keeps its shape (`width?: string`) and no document migration is involved.
 */
const WIDTH_STATES: {
  state: WidthStateName;
  label: string;
  title: string;
  /** The width the state stores; `auto` stores nothing, like an empty value. */
  stored?: string;
}[] = [
  {
    state: "auto",
    label: "Auto",
    title: "Auto — the browser decides, no width authored",
  },
  {
    state: "fill",
    label: "Fill",
    title: `Fill — width: ${FILL_WIDTH}`,
    stored: FILL_WIDTH,
  },
  {
    state: "fit",
    label: "Fit content",
    title: `Fit content — width: ${FIT_CONTENT_WIDTH}`,
    stored: FIT_CONTENT_WIDTH,
  },
];

const getWidthState = (value?: string): WidthState => {
  const authored = normalizeAuthoredWidth(value);
  if (!authored) return "auto";

  const match = WIDTH_STATES.find(
    (item) => item.stored?.toLowerCase() === authored.toLowerCase(),
  );

  return match?.state ?? "custom";
};

interface WidthControlProps {
  value?: string;
  isModified: boolean;
  onReset: () => void;
  onChange: (value: string | undefined) => void;
}

/**
 * The Width field says what it means.
 *
 * The empty value is still the default, but it is now labelled *Auto* instead
 * of being the only representation of "the browser decides", and the two named
 * states are one click away: *Fill* stores `100%` — the same width
 * `getDimensionVars` implies when only a max width is authored — and *Fit
 * content* stores `fit-content`. Any other value is a custom width and leaves
 * every state unpressed, because the numeric input already shows it.
 *
 * `fit-content` is also offered to the value/unit input as an allowed keyword,
 * so it survives a re-commit instead of being rewritten as an opaque `f(x)`.
 */
export const WidthControl = ({
  value,
  isModified,
  onReset,
  onChange,
}: WidthControlProps) => {
  const state = getWidthState(value);

  return (
    <div className="flex flex-col gap-y-1">
      <PropHeader
        name={WIDTH_FIELD}
        label="Width"
        isModified={isModified}
        onReset={onReset}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          name={`${WIDTH_FIELD}-state`}
          // No item is pressed for a custom value: the numeric input shows it.
          value={state === "custom" ? "" : state}
          onChange={(next) =>
            onChange(WIDTH_STATES.find((item) => item.state === next)?.stored)
          }
          items={WIDTH_STATES.map(({ state: itemState, label, title }) => ({
            value: itemState,
            label,
            title,
          }))}
          className="w-auto shrink-0"
        />
        <div className="min-w-0 flex-1">
          <ValueUnitInput
            name={WIDTH_FIELD}
            value={value ?? ""}
            onChange={(next) => onChange(next || undefined)}
            allowedKeywords={["auto", FIT_CONTENT_WIDTH]}
            placeholder="auto"
          />
        </div>
      </div>
    </div>
  );
};
