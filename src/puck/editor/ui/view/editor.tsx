import "client-only";

import type { ReactNode } from "react";
import { Puck } from "@puckeditor/core";

import type { SiteLayoutPreview } from "@/modules/site-regions/lib/site-layout-preview";

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
    <div className="flex flex-col h-[calc(100vh-3.75rem)] overflow-hidden">
      <BuilderHeader header={header} siteLayout={siteLayout} />
      <div className="grid grid-cols-[300px_1fr_300px] flex-1 overflow-hidden">
        <div className="h-full border-r overflow-hidden">
          <ElementsPanel />
        </div>

        <div className="flex justify-center min-w-0 relative">
          <PuckBuilder />
        </div>

        <div className="flex h-full flex-col border-l">
          <EditorRootEntry rootLabel={rootLabel} {...rootEntry} />
          <div className="flex-1 overflow-y-auto">
            <Puck.Fields />
          </div>
        </div>
      </div>
    </div>
  );
};
