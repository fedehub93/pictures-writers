"use client";
import "client-only";

import type { CustomField } from "@puckeditor/core";

import { SwitchInput } from "@/puck/components/switch-input";

/**
 * Header-only root field that keeps the region at the top of the viewport while
 * the page scrolls.
 *
 * The value lives in `root.props.sticky` and is saved and published with the
 * region version. The canvas keeps rendering the header in normal flow, so the
 * hint makes clear that the effect is only visible on the published site.
 */
export const HeaderStickyField: CustomField<boolean | undefined> = {
  type: "custom",
  render: ({ name, value, onChange }) => (
    <div className="flex flex-col gap-y-2 p-1">
      <SwitchInput
        name={name}
        label="Stick header on scroll"
        checked={value === true}
        onChange={(checked) => onChange(checked)}
      />
      <p className="text-xs text-muted-foreground">
        The canvas renders the header in normal flow; the effect is visible on
        the published site.
      </p>
    </div>
  ),
};
