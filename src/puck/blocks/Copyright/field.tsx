"use client";
import "client-only";

import type { Field } from "@puckeditor/core";
import { CopyrightIcon } from "lucide-react";

import { PANEL_CONTROL } from "@/puck/components/panel-control";
import { PropHeader } from "@/puck/components/prop-header";
import { SwitchInput } from "@/puck/components/switch-input";
import { LinksSection } from "@/puck/fields/link/ui/links-section";
import { withContentField } from "@/puck/utils/with-content-field";
import { Textarea } from "@/shared/ui/textarea";

import { COPYRIGHT_DEFAULT_CONTENT } from "./defaults";
import type { CopyrightBlockContent } from "./types";

/**
 * The Copyright section.
 *
 * Year, extra text and links are the whole authored content of the block, so
 * they share one accordion. The links use the same dialog as the Link list
 * block.
 */
export const CopyrightContentField: Field<CopyrightBlockContent | undefined> =
  withContentField<CopyrightBlockContent>({
    label: "Copyright",
    icon: <CopyrightIcon className="size-4 text-muted-foreground" />,
    render: ({ value, update, reset }) => (
      <div className="grid grid-cols-1 gap-y-4 p-1">
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="showYear"
            label="Year"
            isModified={
              value.showYear !== undefined &&
              value.showYear !== COPYRIGHT_DEFAULT_CONTENT.showYear
            }
            onReset={() => reset("showYear")}
          />
          <SwitchInput
            name="showYear"
            label="Show current year"
            checked={value.showYear ?? COPYRIGHT_DEFAULT_CONTENT.showYear}
            onChange={(checked) => update("showYear", checked)}
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="extraText"
            label="Extra text"
            isModified={
              value.extraText !== undefined &&
              value.extraText !== COPYRIGHT_DEFAULT_CONTENT.extraText
            }
            onReset={() => reset("extraText")}
          />
          <Textarea
            id="extraText"
            value={value.extraText ?? ""}
            onChange={(event) => update("extraText", event.target.value)}
            rows={2}
            className={PANEL_CONTROL.textArea}
            placeholder="All rights reserved."
          />
        </div>

        <LinksSection
          links={value.links ?? COPYRIGHT_DEFAULT_CONTENT.links}
          isModified={value.links !== undefined}
          onReset={() => reset("links")}
          onChange={(links) => update("links", links)}
        />
      </div>
    ),
  });
