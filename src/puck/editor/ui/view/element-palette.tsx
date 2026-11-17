import "client-only";

import type { Config } from "@puckeditor/core";
import { Drawer } from "@puckeditor/core";
import {
  GripIcon,
  SearchIcon,
  SquareIcon,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

import { ELEMENT_ICONS, ELEMENT_LABELS } from "./element-meta";

type PaletteElement = {
  name: string;
  label: string;
  icon: LucideIcon;
};

type PaletteGroup = {
  key: string;
  title: string;
  elements: PaletteElement[];
};

/**
 * The palette is the config's categories, in declaration order.
 *
 * The component map is the document's vocabulary — every stored node may name
 * any registered block — so it cannot be the author-facing surface. A block
 * that no category lists stays registered and keeps rendering its documents,
 * and is simply not offered. A category therefore is the only way into the
 * palette, and the palette is the only surface a block can be retired from.
 *
 * Search matches labels, case-insensitively, and drops the groups it empties:
 * the result keeps the grouping of what is left instead of flattening into one
 * list.
 */
function paletteGroups(config: Config, search = ""): PaletteGroup[] {
  const query = search.trim().toLowerCase();

  return Object.entries(config.categories ?? {}).flatMap(([key, category]) => {
    const elements = (category.components ?? [])
      .map((name) => ({
        name,
        label: ELEMENT_LABELS[name] ?? name,
        icon: ELEMENT_ICONS[name] ?? SquareIcon,
      }))
      .filter(
        (element) =>
          query === "" || element.label.toLowerCase().includes(query),
      );

    if (elements.length === 0) return [];

    return [{ key, title: category.title ?? key, elements }];
  });
}

/**
 * The palette body: a search box over one draggable group per category.
 *
 * Driven entirely by its props so a test can render it from a config; the
 * panel around it owns the search state and the tabs.
 */
export const ElementsPalette = ({
  config,
  search,
  onSearchChange,
}: {
  config: Config;
  search: string;
  onSearchChange: (value: string) => void;
}) => {
  const groups = paletteGroups(config, search);
  const query = search.trim();

  return (
    <div className="p-4">
      <div className="relative mb-6">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search widgets"
          placeholder="Search Widget..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9 bg-background shadow-sm border-muted-foreground/30 text-sm"
        />
      </div>

      {groups.length > 0 ? (
        <Drawer>
          <div className="space-y-6 pb-8">
            {groups.map((group) => (
              <section key={group.key} aria-label={group.title}>
                <h3 className="mb-3 text-xs font-semibold text-muted-foreground">
                  {group.title}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {group.elements.map((element) => (
                    <Drawer.Item key={element.name} name={element.name}>
                      {() => (
                        <Card className="relative max-w-40 mx-auto flex flex-col items-center justify-center p-4 h-22.5 cursor-pointer hover:border-primary/50 transition-colors shadow-sm rounded-md">
                          <div className="absolute top-2 right-2 text-muted-foreground">
                            <GripIcon className="h-3 w-3 opacity-50" />
                          </div>

                          <div className="flex flex-col items-center">
                            <element.icon className="size-6 text-slate-600 mb-2 stroke-[1.5]" />
                            <span className="text-xs text-slate-600 font-medium">
                              {element.label}
                            </span>
                          </div>
                        </Card>
                      )}
                    </Drawer.Item>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Drawer>
      ) : (
        query !== "" && (
          <p className="px-2 py-10 text-center text-xs font-medium text-muted-foreground">
            {`No blocks match "${query}"`}
          </p>
        )
      )}
    </div>
  );
};
