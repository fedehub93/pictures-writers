"use client";
import "client-only";

import type { Field } from "@puckeditor/core";
import { ListIcon } from "lucide-react";

import { LinksSection } from "@/puck/fields/link/ui/links-section";
import { PropHeader } from "@/puck/components/prop-header";
import { TextInput } from "@/puck/components/text-input";
import { withContentField } from "@/puck/utils/with-content-field";

import { LINK_LIST_DEFAULT_CONTENT } from "./defaults";
import type { LinkListBlockContent } from "./types";

/**
 * The Link list section.
 *
 * The title and the links are the whole authored content of the block, so they
 * share one accordion. The links use the shared inline editor instead of the
 * native array field because they live inside this custom section.
 */
export const LinkListContentField: Field<LinkListBlockContent | undefined> =
  withContentField<LinkListBlockContent>({
    label: "Link list",
    icon: <ListIcon className="size-4 text-muted-foreground" />,
    render: ({ value, update, reset }) => (
      <div className="grid grid-cols-1 gap-y-4 p-1">
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="title"
            label="Title"
            isModified={
              value.title !== undefined &&
              value.title !== LINK_LIST_DEFAULT_CONTENT.title
            }
            onReset={() => reset("title")}
          />
          <TextInput
            name="title"
            value={value.title}
            placeholder={LINK_LIST_DEFAULT_CONTENT.title}
            onChange={(next) => update("title", next)}
          />
        </div>

        <LinksSection
          links={value.links ?? LINK_LIST_DEFAULT_CONTENT.links}
          isModified={value.links !== undefined}
          onReset={() => reset("links")}
          onChange={(links) => update("links", links)}
        />
      </div>
    ),
  });
