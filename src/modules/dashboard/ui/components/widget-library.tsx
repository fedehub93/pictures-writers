"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { Input } from "@/shared/ui/input";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { WIDGET_GROUPS } from "@/shared/dashboard/groups";
import type { WidgetDefinition, WidgetGroupId } from "@/shared/dashboard/types";
import { cn } from "@/shared/lib/utils";

interface WidgetLibraryProps {
  /** The definitions the current user is permitted to add. */
  definitions: WidgetDefinition[];
  onSelect: (definitionId: string) => void;
  /** The element that opens the library. */
  children: ReactNode;
}

interface WidgetLibrarySection {
  id: WidgetGroupId;
  label: string;
  color: string;
  definitions: WidgetDefinition[];
}

const normalize = (value: string) => value.trim().toLowerCase();

const matchesQuery = (definition: WidgetDefinition, query: string) =>
  definition.title.toLowerCase().includes(query) ||
  (definition.description?.toLowerCase().includes(query) ?? false);

/**
 * The widget library. On desktop it is a dialog opening the group sidebar and
 * grid side by side; below the mobile breakpoint the same content is shown in a
 * bottom drawer, mirroring `ResponsiveDialog`. The trigger is supplied by the
 * caller so the same library backs both the persistent `+` control and the
 * empty-dashboard prompt.
 */
export const WidgetLibrary = ({
  definitions,
  onSelect,
  children,
}: WidgetLibraryProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<WidgetGroupId | null>(null);
  const [mobileGroup, setMobileGroup] = useState<WidgetGroupId | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const normalizedQuery = normalize(query);

  const sections = useMemo<WidgetLibrarySection[]>(() => {
    const matched = normalizedQuery
      ? definitions.filter((definition) =>
          matchesQuery(definition, normalizedQuery),
        )
      : definitions;

    return WIDGET_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      color: group.color,
      definitions: matched.filter(
        (definition) => definition.group === group.id,
      ),
    })).filter((section) => section.definitions.length > 0);
  }, [definitions, normalizedQuery]);

  const visibleSections = useMemo(
    () =>
      mobileGroup
        ? sections.filter((section) => section.id === mobileGroup)
        : sections,
    [sections, mobileGroup],
  );

  const sectionKey = sections.map((section) => section.id).join(",");

  useEffect(() => {
    if (!open) return;
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.getAttribute("data-group");
        if (id) setActiveGroup(id as WidgetGroupId);
      },
      { root: container, rootMargin: "-10% 0px -75% 0px", threshold: 0 },
    );

    Object.values(sectionRefs.current).forEach((element) => {
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [open, sectionKey, isMobile]);

  const scrollToGroup = (id: WidgetGroupId) => {
    const container = scrollRef.current;
    const section = sectionRefs.current[id];
    if (!container || !section) return;
    const top =
      section.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop;
    container.scrollTo({ top, behavior: "smooth" });
    setActiveGroup(id);
  };

  const select = (definitionId: string) => {
    onSelect(definitionId);
    setOpen(false);
  };

  const reset = () => {
    setQuery("");
    setMobileGroup(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const panel = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b px-4 py-3 lg:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search widgets…"
            className="pl-9"
            aria-label="Search widgets"
          />
        </div>
      </div>

      {sections.length > 1 ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b px-4 py-3 lg:hidden">
          <GroupChip
            label="All"
            active={mobileGroup === null}
            onClick={() => setMobileGroup(null)}
          />
          {sections.map((section) => (
            <GroupChip
              key={section.id}
              label={section.label}
              color={section.color}
              active={mobileGroup === section.id}
              onClick={() => setMobileGroup(section.id)}
            />
          ))}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto scroll-smooth p-4 lg:p-6"
      >
        {visibleSections.length === 0 ? (
          <NoResults query={query} onClear={() => setQuery("")} />
        ) : (
          <div className="flex flex-col gap-6">
            {visibleSections.map((section) => (
              <section
                key={section.id}
                data-group={section.id}
                ref={(element) => {
                  sectionRefs.current[section.id] = element;
                }}
                className="flex flex-col gap-3 scroll-mt-2"
              >
                <h3 className="text-sm font-medium text-muted-foreground">
                  {section.label}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.definitions.map((definition) => (
                    <WidgetCard
                      key={definition.id}
                      definition={definition}
                      color={section.color}
                      onSelect={() => select(definition.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} handleOnly>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="h-[90vh] gap-0 p-0">
          <DrawerHeader className="border-b px-4 py-4 text-left">
            <DrawerTitle>Add widget</DrawerTitle>
            <DrawerDescription>
              Choose a widget to add to your dashboard.
            </DrawerDescription>
          </DrawerHeader>
          {panel}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl lg:h-[85vh] lg:max-w-5xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Add widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {sections.length > 0 ? (
            <nav
              aria-label="Widget groups"
              className="hidden shrink-0 flex-col gap-1 border-r p-3 lg:flex lg:w-56"
            >
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToGroup(section.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                    activeGroup === section.id && "bg-accent font-medium",
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: section.color }}
                  />
                  <span className="truncate">{section.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {section.definitions.length}
                  </span>
                </button>
              ))}
            </nav>
          ) : null}

          {panel}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface WidgetCardProps {
  definition: WidgetDefinition;
  color: string;
  onSelect: () => void;
}

const WidgetCard = ({ definition, color, onSelect }: WidgetCardProps) => {
  const Icon = definition.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col overflow-hidden rounded-lg border text-left transition-colors hover:border-foreground/20 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className="aspect-video w-full border-b bg-muted bg-cover bg-center"
        style={
          definition.previewImage
            ? { backgroundImage: `url(${definition.previewImage})` }
            : {
                backgroundImage: `linear-gradient(135deg, ${color}26, transparent)`,
              }
        }
      >
        {definition.previewImage ? null : (
          <span className="flex h-full w-full items-center justify-center">
            <Icon className="size-7" style={{ color }} />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-sm font-medium">{definition.title}</span>
        {definition.description ? (
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {definition.description}
          </span>
        ) : null}
      </div>
    </button>
  );
};

interface GroupChipProps {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}

const GroupChip = ({ label, color, active, onClick }: GroupChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
      active ? "bg-foreground text-background" : "hover:bg-accent",
    )}
  >
    {color ? (
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
    ) : null}
    {label}
  </button>
);

interface NoResultsProps {
  query: string;
  onClear: () => void;
}

const NoResults = ({ query, onClear }: NoResultsProps) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
    <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Search className="size-5" />
    </span>
    <p className="text-sm text-muted-foreground">
      No widgets match &ldquo;{query}&rdquo;.
    </p>
    <Button type="button" variant="outline" size="sm" onClick={onClear}>
      Clear search
    </Button>
  </div>
);

interface AddWidgetButtonProps {
  definitions: WidgetDefinition[];
  onSelect: (definitionId: string) => void;
}

/**
 * The persistent `+` control, pinned to the bottom-right of the viewport. It
 * opens the widget library in both read and edit mode, so adding a widget is
 * never gated behind arranging.
 */
export const AddWidgetButton = ({
  definitions,
  onSelect,
}: AddWidgetButtonProps) => (
  <WidgetLibrary definitions={definitions} onSelect={onSelect}>
    <Button
      type="button"
      size="icon-lg"
      aria-label="Add widget"
      className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg md:bottom-8 md:right-8"
    >
      <Plus className="size-5" />
    </Button>
  </WidgetLibrary>
);
