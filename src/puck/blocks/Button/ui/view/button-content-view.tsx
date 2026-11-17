"use client";
import "client-only";

import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";
import { TextInput } from "@/puck/components/text-input";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import { IconView } from "@/puck/fields/icon/ui/view/icon-view";
import { LinkView } from "@/puck/fields/link/ui/view/link-view";
import { BUTTON_DEFAULT_PROPS } from "@/puck/blocks/defaults";
import {
  BUTTON_DEFAULT_VARIANT,
  BUTTON_ICON_DEFAULT_POSITION,
  BUTTON_ICON_DEFAULT_SPACING,
  BUTTON_VARIANTS,
} from "@/puck/blocks/Button/constants";
import type {
  ButtonContentProps,
  ButtonIconPosition,
  ButtonVariant,
} from "@/puck/blocks/Button/types";
import { EMPTY_LINK } from "@/puck/fields/link/lib/links";
import {
  normalizeLinkProps,
  withLinkLabel,
  type LinkProps,
} from "@/puck/fields/link/types";
import type { ContentFieldRenderProps } from "@/puck/utils/with-content-field";

const DEFAULT_LABEL = BUTTON_DEFAULT_PROPS.button?.link?.label;

const VARIANT_TITLES: Record<ButtonVariant, string> = {
  primary: "Primary",
  secondary: "Secondary",
  outline: "Outline",
  ghost: "Ghost",
};

const VARIANT_ITEMS: { value: ButtonVariant; title: string }[] =
  BUTTON_VARIANTS.map((value) => ({ value, title: VARIANT_TITLES[value] }));

/**
 * The one authored section of a Button.
 *
 * Order is the order the button reads — Variant, Text, Link, Icon, Icon
 * position, Icon spacing — and the text is presented first of the content
 * even though it is stored as the Smart link's label. The link editor keeps
 * owning target selection (and the auto-fill from an entity title); its own
 * label control is switched off because the Text control above owns the words.
 *
 * The variant leads because it is the starting look. Its inheritance is stated
 * in one line inside the section: a Decoration or Typography field sees only
 * its own prop, so it cannot show the variant's value as a placeholder.
 */
export const ButtonContentView = ({
  value,
  update,
  reset,
}: ContentFieldRenderProps<ButtonContentProps>) => {
  const link = normalizeLinkProps(value.link) ?? EMPTY_LINK;
  const text = link.label ?? "";

  const setLink = (next: LinkProps) => update("link", next);

  return (
    <div className="grid grid-cols-1 gap-y-4 p-1">
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="variant"
          label="Variant"
          isModified={
            value.variant !== undefined &&
            value.variant !== BUTTON_DEFAULT_VARIANT
          }
          onReset={() => reset("variant")}
        />
        <SegmentedControl<ButtonVariant>
          name="variant"
          value={value.variant ?? BUTTON_DEFAULT_VARIANT}
          onChange={(variant) => update("variant", variant)}
          items={VARIANT_ITEMS}
        />
        <p className="text-xs text-muted-foreground">
          The variant and the Button&apos;s base box set the starting style; a
          Decoration, Typography or Spacing value overrides it.
        </p>
      </div>

      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="text"
          label="Text"
          isModified={text !== "" && text !== DEFAULT_LABEL}
          onReset={() => setLink(withLinkLabel(link, DEFAULT_LABEL))}
        />
        <TextInput
          name="text"
          value={text}
          onChange={(next) => setLink(withLinkLabel(link, next || undefined))}
          placeholder={DEFAULT_LABEL}
        />
      </div>

      <LinkView
        state={link}
        onUpdate={setLink}
        showLabel={false}
        defaultLabel={DEFAULT_LABEL}
        idPrefix="button-link-"
      />

      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="icon"
          label="Icon"
          isModified={value.icon?.name !== undefined}
          onReset={() => reset("icon")}
        />
        <IconView
          state={value.icon}
          onUpdate={(icon) => update("icon", icon)}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="iconPosition"
          label="Icon position"
          isModified={
            value.iconPosition !== undefined &&
            value.iconPosition !== BUTTON_ICON_DEFAULT_POSITION
          }
          onReset={() => reset("iconPosition")}
        />
        <SegmentedControl<ButtonIconPosition>
          name="iconPosition"
          value={value.iconPosition ?? BUTTON_ICON_DEFAULT_POSITION}
          onChange={(position) => update("iconPosition", position)}
          items={[
            { value: "before", title: "Before" },
            { value: "after", title: "After" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="iconSpacing"
          label="Icon spacing"
          isModified={value.iconSpacing !== undefined}
          onReset={() => reset("iconSpacing")}
        />
        <ValueUnitInput
          name="iconSpacing"
          value={value.iconSpacing ?? ""}
          onChange={(spacing) =>
            spacing ? update("iconSpacing", spacing) : reset("iconSpacing")
          }
          placeholder={BUTTON_ICON_DEFAULT_SPACING}
          defaultUnit="em"
        />
      </div>
    </div>
  );
};
