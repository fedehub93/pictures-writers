import "client-only";

import type { ReactNode } from "react";
import { Puck } from "@puckeditor/core";

import type { SiteLayoutPreview } from "@/modules/site-regions/lib/site-layout-preview";
import { TextEditModeProvider } from "@/puck/editor/text-edit-mode/text-edit-mode-provider";

import { PuckBuilder } from "./builder";
import { BuilderHeader } from "./header";
import { ElementsPanel } from "./sidebar";
import { EditorRootEntry } from "../components/editor-root-entry";
import { useEditorRootEntry } from "../components/use-editor-root-entry";

export type EditorHeaderProps = {
  title: string;
  actions: ReactNode;
  /**
   * Show the interactive-preview toggle. Only the Site region editor opts in,
   * so pages keep their current editing experience.
   */
  showPreview?: boolean;
};

export const Editor = ({
  header,
  siteLayout,
  rootLabel,
}: {
  header?: EditorHeaderProps;
  /** Header and Footer documents shown around the Page, when previewed. */
  siteLayout?: SiteLayoutPreview;
  /** Document name shown by the root entry points ("Page", "Header", "Footer"). */
  rootLabel: string;
}) => {
  const rootEntry = useEditorRootEntry();

  return (
    <TextEditModeProvider>
      <div className="flex flex-col h-[calc(100vh-3.75rem)] overflow-hidden">
        <BuilderHeader header={header} siteLayout={siteLayout} />
        {/*
          `grid-rows-1` is load-bearing: the implicit row would be `auto`, and an
          auto track grows to the tallest non-scrolling child. The properties
          panel, once it stopped being a scroll container itself, would then
          stretch all three columns to its content height, leaving its own
          `overflow-y-auto` nothing to scroll and making `overflow-hidden` below
          clip the fields.
        */}
        <div className="grid grid-cols-[300px_1fr_300px] grid-rows-1 flex-1 overflow-hidden">
          <div className="h-full border-r overflow-hidden">
            <ElementsPanel />
          </div>

          <div className="relative flex min-w-0 justify-center overflow-hidden">
            <PuckBuilder />
          </div>

          <div className="flex h-full flex-col border-l">
            <EditorRootEntry rootLabel={rootLabel} {...rootEntry} />
            {/* The panel header stays pinned: the field list is the only scroller. */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Puck.Fields />
            </div>
          </div>
        </div>
      </div>
    </TextEditModeProvider>
  );
};
