"use client";

import {
  Undo2Icon,
  Redo2Icon,
  ZoomOutIcon,
  ZoomInIcon,
  ChevronDownIcon,
  PanelTopIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useParams } from "next/navigation";

import { Config, createUsePuck } from "@puckeditor/core";
import { getViewportKey } from "@/puck/utils/viewports";

import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import type { SiteLayoutPreview } from "@/modules/site-regions/lib/site-layout-preview";

import { useEditorStore } from "../../store/use-editor-store";
import { HeaderActions } from "../components/header-actions";
import { PreviewToggle } from "../components/preview-toggle";
import { SiteLayoutStatusChips } from "../components/site-layout-status-chips";
import type { EditorHeaderProps } from "./editor";

const usePuck = createUsePuck<Config>();

export const BuilderHeader = ({
  header,
  siteLayout,
}: {
  header?: EditorHeaderProps;
  siteLayout?: SiteLayoutPreview;
}) => {
  const trpc = useTRPC();
  const { rootId } = useParams<{ rootId?: string }>();
  const { viewports } = usePuck((s) => s.appState.ui);
  const history = usePuck((s) => s.history);
  const dispatch = usePuck((s) => s.dispatch);

  const {
    scale,
    setScale,
    isAutoZoom,
    setIsAutoZoom,
    showSiteLayout,
    setShowSiteLayout,
  } = useEditorStore();

  // A caller that supplies its own header (the Site region editor) is not
  // editing a Page, so skip the page query entirely.
  const { data: page } = useQuery({
    ...trpc.pages.getLastByRootId.queryOptions(
      { rootId: rootId ?? "" },
      { enabled: !!rootId && !header },
    ),
  });

  const handleZoomIn = () => {
    setIsAutoZoom(false);
    setScale(Math.min(2, scale + 0.1));
  };

  const handleZoomOut = () => {
    setIsAutoZoom(false);
    setScale(Math.max(0.2, scale - 0.1));
  };

  const enableAutoZoom = () => {
    setIsAutoZoom(true);
  };

  const viewportKey = getViewportKey(viewports.current.width);

  return (
    <>
      <header className="z-50 h-14 bg-background border-b px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                dispatch({
                  type: "setUi",
                  ui: { leftSideBarVisible: !leftSideBarVisible },
                })
              }
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <PanelLeftIcon
                className={`size-4 ${leftSideBarVisible ? "text-foreground" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                dispatch({
                  type: "setUi",
                  ui: { rightSideBarVisible: !rightSideBarVisible },
                })
              }
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <PanelRightIcon
                className={`size-4 ${rightSideBarVisible ? "text-foreground" : ""}`}
              />
            </Button>
          </div>

          <div className="h-4 w-px bg-border hidden md:block" /> */}

          <h1 className="text-sm font-medium text-foreground hidden md:block">
            {header?.title ?? page?.title}
          </h1>

          <SiteLayoutStatusChips
            showSiteLayout={showSiteLayout}
            siteLayout={siteLayout}
          />
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <div className="flex items-center gap-1">
            {viewports.options.map((v) => {
              const Icon = v.icon!;
              return (
                <Button
                  key={v.label!}
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    dispatch({
                      type: "setUi",
                      ui: {
                        viewports: {
                          ...viewports,
                          current: {
                            width: v.width,
                            height: v.height ?? "auto",
                          },
                        },
                      },
                    })
                  }
                  className={cn(
                    `size-8 rounded-md text-slate-700 hover:bg-muted`,
                    viewportKey.toLowerCase() === v.label?.toLowerCase() &&
                      "text-primary",
                  )}
                >
                  {Icon}
                </Button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-border mx-2" />

          {/* Site layout preview: page editor only, region editors keep their
              own header and canvas without the regions. */}
          {!header && (
            <>
              <Button
                type="button"
                variant={showSiteLayout ? "secondary" : "ghost"}
                size="icon"
                aria-pressed={showSiteLayout}
                title={
                  showSiteLayout
                    ? "Hide the site header and footer"
                    : "Show the site header and footer"
                }
                onClick={() => setShowSiteLayout(!showSiteLayout)}
                className="size-8 rounded-md text-slate-700 hover:bg-muted"
              >
                <PanelTopIcon className="size-4" />
              </Button>

              <div className="w-px h-4 bg-border mx-2" />
            </>
          )}

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="size-8 rounded-md text-slate-700 hover:bg-muted"
            >
              <ZoomOutIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="size-8 rounded-md text-slate-700 hover:bg-muted"
            >
              <ZoomInIcon className="size-4" />
            </Button>
          </div>

          <div className="w-px h-4 bg-border mx-2" />

          {/* Percentuale */}
          <Button
            variant="ghost"
            onClick={enableAutoZoom}
            className="h-8 px-2 text-xs text-slate-700 hover:bg-muted font-normal flex items-center gap-1"
            title="Reset automatic zoom"
          >
            {Math.round(scale * 100)}% {isAutoZoom ? "(Auto)" : ""}
            <ChevronDownIcon className="size-3 text-muted-foreground opacity-70" />
          </Button>
        </div>

        {/* Sezione Destra: Azioni */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
            disabled={!history.hasPast}
            onClick={() => history.back()}
          >
            <Undo2Icon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
            disabled={!history.hasFuture}
            onClick={() => history.forward()}
          >
            <Redo2Icon className="size-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {header?.showPreview && (
            <>
              <PreviewToggle />
              <div className="h-4 w-px bg-border mx-1" />
            </>
          )}

          {header?.actions}
          {!header && !page && (
            <Skeleton className="h-8 min-w-10 lg:min-w-60" />
          )}
          {!header && page && (
            <HeaderActions
              page={{
                id: page.id,
                rootId: page.rootId!,
                slug: page.slug,
                status: page.status,
              }}
            />
          )}
        </div>
      </header>
    </>
  );
};
