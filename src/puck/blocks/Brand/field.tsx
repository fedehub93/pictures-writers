"use client";
import "client-only";

import type { Field } from "@puckeditor/core";
import { TagIcon } from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { SwitchInput } from "@/puck/components/switch-input";
import { TextInput } from "@/puck/components/text-input";
import { withContentField } from "@/puck/utils/with-content-field";

import { BRAND_DEFAULT_CONTENT } from "./defaults";
import type { BrandBlockContent } from "./types";

/**
 * The Brand content section.
 *
 * Logo and site-name visibility are switches, while the two text fields hold
 * the per-block overrides. Everything lives in the same accordion so the block
 * reads as one thing instead of a mix of native radio and text fields.
 */
export const BrandContentField: Field<BrandBlockContent | undefined> =
  withContentField<BrandBlockContent>({
    label: "Brand",
    icon: <TagIcon className="size-4 text-muted-foreground" />,
    render: ({ value, update, reset }) => (
      <div className="grid grid-cols-1 gap-y-4 p-1">
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="showLogo"
            label="Logo"
            isModified={
              value.showLogo !== undefined &&
              value.showLogo !== BRAND_DEFAULT_CONTENT.showLogo
            }
            onReset={() => reset("showLogo")}
          />
          <SwitchInput
            name="showLogo"
            label="Show logo"
            checked={value.showLogo ?? BRAND_DEFAULT_CONTENT.showLogo}
            onChange={(checked) => update("showLogo", checked)}
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="showSiteName"
            label="Site name"
            isModified={
              value.showSiteName !== undefined &&
              value.showSiteName !== BRAND_DEFAULT_CONTENT.showSiteName
            }
            onReset={() => reset("showSiteName")}
          />
          <SwitchInput
            name="showSiteName"
            label="Show site name"
            checked={
              value.showSiteName ?? BRAND_DEFAULT_CONTENT.showSiteName
            }
            onChange={(checked) => update("showSiteName", checked)}
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="customText"
            label="Custom text"
            isModified={value.customText !== undefined}
            onReset={() => reset("customText")}
          />
          <TextInput
            name="customText"
            value={value.customText}
            placeholder="Use the site name"
            onChange={(next) => update("customText", next)}
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="customLogoUrl"
            label="Custom logo URL"
            isModified={value.customLogoUrl !== undefined}
            onReset={() => reset("customLogoUrl")}
          />
          <TextInput
            name="customLogoUrl"
            value={value.customLogoUrl}
            placeholder="Use the site logo"
            onChange={(next) => update("customLogoUrl", next)}
          />
        </div>
      </div>
    ),
  });
