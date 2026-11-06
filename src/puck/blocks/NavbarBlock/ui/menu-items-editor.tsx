"use client";
import "client-only";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

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

import {
  createColumnChild,
  createNavItem,
  moveNavItem,
} from "../lib/menu";
import {
  NAV_ITEM_TYPES,
  NAV_ITEM_TYPE_LABELS,
  type NavItem,
  type NavbarColumnChild,
  type NavbarCtaVariant,
} from "../types";

const EMPTY_LINK: LinkProps = { type: "external", url: "" };

function toLinkProps(link: LinkProps | undefined): LinkProps {
  return normalizeLinkProps(link) ?? EMPTY_LINK;
}

/**
 * Structured editor for the typed menu tree.
 *
 * Puck's generic array field cannot express a discriminated union, so the
 * editor renders one card per item with only the controls that item type
 * supports. Every change produces a brand-new tree, which keeps undo/redo and
 * the "save only when dirty" check working as usual.
 */
export const MenuItemsEditor = ({
  items = [],
  onChange,
}: {
  items?: NavItem[];
  onChange: (items: NavItem[]) => void;
}) => {
  const update = (index: number, next: NavItem) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? next : item)));
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex flex-wrap gap-1">
        {NAV_ITEM_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            size="xs"
            variant="outline"
            onClick={() => onChange([...items, createNavItem(type)])}
          >
            <PlusIcon data-icon="inline-start" />
            {NAV_ITEM_TYPE_LABELS[type]}
          </Button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Add a link, column, card or call to action to build the menu.
        </p>
      ) : null}

      {items.map((item, index) => (
        <div
          key={`${item.type}-${index}`}
          className="flex flex-col gap-3 rounded-md border p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {NAV_ITEM_TYPE_LABELS[item.type]}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move item up"
                disabled={index === 0}
                onClick={() => onChange(moveNavItem(items, index, -1))}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Move item down"
                disabled={index === items.length - 1}
                onClick={() => onChange(moveNavItem(items, index, 1))}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove item"
                onClick={() =>
                  onChange(
                    items.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label
              htmlFor={`navbar-item-label-${index}`}
              className="text-xs text-muted-foreground"
            >
              Label
            </Label>
            <TextInput
              name={`navbar-item-label-${index}`}
              value={item.label}
              onChange={(label) => update(index, { ...item, label })}
              placeholder="Menu label"
            />
          </div>

          {item.type !== "column" ? (
            <MenuLinkEditor
              label="Destination"
              value={item.link}
              onChange={(link) => update(index, { ...item, link })}
            />
          ) : null}

          {item.type === "column" ? (
            <ColumnItemsEditor
              idPrefix={`navbar-column-${index}`}
              items={item.items}
              onChange={(nextItems) => update(index, { ...item, items: nextItems })}
            />
          ) : null}

          {item.type === "card" ? (
            <>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor={`navbar-card-description-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id={`navbar-card-description-${index}`}
                  value={item.description ?? ""}
                  onChange={(event) =>
                    update(index, {
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
                  htmlFor={`navbar-card-image-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  Image URL
                </Label>
                <TextInput
                  name={`navbar-card-image-${index}`}
                  value={item.imageUrl}
                  onChange={(imageUrl) =>
                    update(index, { ...item, imageUrl: imageUrl || undefined })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <MenuIconEditor
                value={item.icon}
                onChange={(icon) => update(index, { ...item, icon })}
              />
            </>
          ) : null}

          {item.type === "cta" ? (
            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`navbar-cta-variant-${index}`}
                className="text-xs text-muted-foreground"
              >
                Variant
              </Label>
              <Select
                value={item.variant ?? "primary"}
                onValueChange={(value) =>
                  update(index, {
                    ...item,
                    variant: value as NavbarCtaVariant,
                  })
                }
              >
                <SelectTrigger
                  id={`navbar-cta-variant-${index}`}
                  className="h-8 w-full text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

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
  idPrefix,
  items = [],
  onChange,
}: {
  idPrefix: string;
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
        <div
          key={index}
          className="flex flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <TextInput
              name={`${idPrefix}-label-${index}`}
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
                onChange(
                  items.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              <Trash2Icon />
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            <Label
              htmlFor={`${idPrefix}-description-${index}`}
              className="text-xs text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id={`${idPrefix}-description-${index}`}
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
          <MenuLinkEditor
            value={item.link}
            onChange={(link) => update(index, { ...item, link })}
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
