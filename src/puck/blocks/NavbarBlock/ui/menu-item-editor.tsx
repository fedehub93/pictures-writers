"use client";
import "client-only";

import { PlusIcon, Trash2Icon } from "lucide-react";

import type { IconProps } from "@/puck/fields/icon";
import { IconView } from "@/puck/fields/icon/ui/view/icon-view";
import { LinkView } from "@/puck/fields/link/ui/view/link-view";
import { normalizeLinkProps, type LinkProps } from "@/puck/fields/link/types";
import { TextInput } from "@/puck/components/text-input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import { createColumnChild } from "../lib/menu";
import type {
  NavItem,
  NavbarColumnChild,
  NavbarCtaVariant,
} from "../types";

const EMPTY_LINK: LinkProps = { type: "external", url: "" };

function toLinkProps(link: LinkProps | undefined): LinkProps {
  return normalizeLinkProps(link) ?? EMPTY_LINK;
}

/**
 * Form for one top-level menu item.
 *
 * Every item type edits its own label and, except `column`, its destination.
 * `card` adds the copy of a mega panel card, `cta` adds the button variant and
 * `column` swaps the destination for the list of its children.
 */
export const MenuItemEditor = ({
  item,
  onChange,
}: {
  item: NavItem;
  onChange: (item: NavItem) => void;
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <Label
        htmlFor="navbar-item-label"
        className="text-xs text-muted-foreground"
      >
        Label
      </Label>
      <TextInput
        name="navbar-item-label"
        value={item.label}
        onChange={(label) => onChange({ ...item, label })}
        placeholder="Menu label"
      />
    </div>

    {item.type !== "column" ? (
      <MenuLinkEditor
        label="Destination"
        value={item.link}
        onChange={(link) => onChange({ ...item, link })}
      />
    ) : null}

    {item.type === "card" ? (
      <>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="navbar-card-description"
            className="text-xs text-muted-foreground"
          >
            Description
          </Label>
          <Textarea
            id="navbar-card-description"
            value={item.description ?? ""}
            onChange={(event) =>
              onChange({
                ...item,
                description: event.target.value || undefined,
              })
            }
            rows={2}
            className="min-h-16 text-xs"
            placeholder="Short description shown inside the card"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="navbar-card-image"
            className="text-xs text-muted-foreground"
          >
            Image URL
          </Label>
          <TextInput
            name="navbar-card-image"
            value={item.imageUrl}
            onChange={(imageUrl) =>
              onChange({ ...item, imageUrl: imageUrl || undefined })
            }
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <MenuIconEditor
          value={item.icon}
          onChange={(icon) => onChange({ ...item, icon })}
        />
      </>
    ) : null}

    {item.type === "cta" ? (
      <div className="flex flex-col gap-1">
        <Label
          htmlFor="navbar-cta-variant"
          className="text-xs text-muted-foreground"
        >
          Variant
        </Label>
        <Select
          value={item.variant ?? "primary"}
          onValueChange={(value) =>
            onChange({
              ...item,
              variant: value as NavbarCtaVariant,
            })
          }
        >
          <SelectTrigger id="navbar-cta-variant" className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ) : null}

    {item.type === "column" ? (
      <ColumnItemsEditor
        items={item.items}
        onChange={(nextItems) => onChange({ ...item, items: nextItems })}
      />
    ) : null}
  </div>
);

const MenuLinkEditor = ({
  label,
  value,
  onChange,
}: {
  label?: string;
  value?: LinkProps;
  onChange: (link: LinkProps) => void;
}) => (
  <div className="flex flex-col gap-1">
    {label ? (
      <span className="text-xs text-muted-foreground">{label}</span>
    ) : null}
    <LinkView state={toLinkProps(value)} onUpdate={onChange} showLabel={false} />
  </div>
);

/**
 * Icon control shared by `card` items and `column` children.
 *
 * It reuses the same `IconView` as the standalone Icon field, so the picker and
 * the stored `{ name }` shape stay identical. Top-level `link` and `cta` items
 * deliberately have no icon.
 */
const MenuIconEditor = ({
  value,
  onChange,
}: {
  value?: IconProps;
  onChange: (icon: IconProps) => void;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">Icon</span>
    <IconView state={value} onUpdate={onChange} />
  </div>
);

const ColumnItemsEditor = ({
  items = [],
  onChange,
}: {
  items?: NavbarColumnChild[];
  onChange: (items: NavbarColumnChild[]) => void;
}) => {
  const update = (index: number, next: NavbarColumnChild) => {
    onChange(
      items.map((item, itemIndex) => (itemIndex === index ? next : item)),
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed p-2">
      <span className="text-xs font-medium text-muted-foreground">
        Column links
      </span>
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <TextInput
              name={`navbar-column-label-${index}`}
              value={item.label}
              onChange={(label) => update(index, { ...item, label })}
              placeholder="Link label"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Remove column link"
              onClick={() =>
                onChange(items.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <Trash2Icon />
            </Button>
          </div>
          <MenuLinkEditor
            value={item.link}
            onChange={(link) => update(index, { ...item, link })}
          />
          <div className="flex flex-col gap-1">
            <Label
              htmlFor={`navbar-column-description-${index}`}
              className="text-xs text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id={`navbar-column-description-${index}`}
              value={item.description ?? ""}
              onChange={(event) =>
                update(index, {
                  ...item,
                  description: event.target.value || undefined,
                })
              }
              rows={2}
              className="min-h-16 text-xs"
              placeholder="Short description shown next to the link"
            />
          </div>
          <MenuIconEditor
            value={item.icon}
            onChange={(icon) => update(index, { ...item, icon })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => onChange([...items, createColumnChild()])}
      >
        <PlusIcon data-icon="inline-start" />
        Add link
      </Button>
    </div>
  );
};
