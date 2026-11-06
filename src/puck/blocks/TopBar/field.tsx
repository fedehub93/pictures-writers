"use client";
import "client-only";

import type { Field } from "@puckeditor/core";
import { Settings2Icon } from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { SwitchInput } from "@/puck/components/switch-input";
import { withContentField } from "@/puck/utils/with-content-field";

import type { TopBarSettings } from "./types";

/**
 * The Top bar settings section.
 *
 * The bar's content is a Puck slot, so its only authored option is whether a
 * visitor can dismiss it. Keeping it in a custom section gives the block the
 * same accordion, icon and property-header affordance as every other Site
 * region block.
 */
export const TopBarSettingsField: Field<TopBarSettings | undefined> =
  withContentField<TopBarSettings>({
    label: "Settings",
    icon: <Settings2Icon className="size-4 text-muted-foreground" />,
    render: ({ value, update, reset }) => {
      const isModified = value.dismissible !== undefined;

      return (
        <div className="grid grid-cols-1 gap-y-4 p-1">
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="dismissible"
              label="Dismissible"
              isModified={isModified}
              onReset={() => reset("dismissible")}
            />
            <SwitchInput
              name="dismissible"
              label="Show close button"
              checked={value.dismissible ?? false}
              onChange={(checked) => update("dismissible", checked)}
            />
          </div>
        </div>
      );
    },
  });
