"use client";
import "client-only";

import type { Field } from "@puckeditor/core";
import { SearchIcon } from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";
import { TextInput } from "@/puck/components/text-input";
import { withContentField } from "@/puck/utils/with-content-field";
import type { SearchBoxVariant } from "@/shared/components/search/types";

import { SEARCH_BAR_DEFAULT_CONTENT } from "./defaults";
import type { SearchBarContent } from "./types";

const VARIANT_ITEMS: { value: SearchBoxVariant; title: string }[] = [
  { value: "inline", title: "Inline" },
  { value: "compact", title: "Icon button (popover)" },
];

/**
 * The Search section.
 *
 * Placeholder and variant are the whole authored content of the block, so they
 * share one accordion instead of appearing as native text and radio fields.
 */
export const SearchBarContentField: Field<SearchBarContent | undefined> =
  withContentField<SearchBarContent>({
    label: "Search",
    icon: <SearchIcon className="size-4 text-muted-foreground" />,
    render: ({ value, update, reset }) => (
      <div className="grid grid-cols-1 gap-y-4 p-1">
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="placeholder"
            label="Placeholder"
            isModified={
              value.placeholder !== undefined &&
              value.placeholder !== SEARCH_BAR_DEFAULT_CONTENT.placeholder
            }
            onReset={() => reset("placeholder")}
          />
          <TextInput
            name="placeholder"
            value={value.placeholder}
            placeholder={SEARCH_BAR_DEFAULT_CONTENT.placeholder}
            onChange={(next) => update("placeholder", next)}
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="variant"
            label="Variant"
            isModified={
              value.variant !== undefined &&
              value.variant !== SEARCH_BAR_DEFAULT_CONTENT.variant
            }
            onReset={() => reset("variant")}
          />
          <SegmentedControl<SearchBoxVariant>
            name="variant"
            value={value.variant ?? SEARCH_BAR_DEFAULT_CONTENT.variant}
            onChange={(next) => update("variant", next)}
            items={VARIANT_ITEMS}
          />
        </div>
      </div>
    ),
  });
