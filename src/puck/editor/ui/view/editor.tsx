import "client-only";

import type { ReactNode } from "react";
import { createUsePuck, Puck } from "@puckeditor/core";

import { getViewportKey } from "@/puck/utils/viewports";

import { PuckBuilder } from "./builder";
import { BuilderHeader } from "./header";
import { ElementsPanel } from "./sidebar";

const usePuck = createUsePuck();

export type EditorHeaderProps = {
  title: string;
  actions: ReactNode;
  /**
   * Show the interactive-preview toggle. Only the Site region editor opts in,
   * so pages keep their current editing experience.
   */
  showPreview?: boolean;
};

export const Editor = ({ header }: { header?: EditorHeaderProps }) => {
  const currentViewport = usePuck(
    (state) => state.appState.ui.viewports.current,
  );
  const viewportKey = getViewportKey(currentViewport.width);

  return (
    <div
      data-editor-viewport={viewportKey}
      className="flex flex-col h-[calc(100vh-3.75rem)] overflow-hidden"
    >
      <BuilderHeader header={header} />
      <div className="grid grid-cols-[300px_1fr_300px] flex-1 overflow-hidden">
        <div className="h-full border-r overflow-hidden">
          <ElementsPanel />
        </div>

        <div className="flex justify-center min-w-0 relative">
          <PuckBuilder />
        </div>

        <div className="h-full overflow-y-auto border-l">
          <Puck.Fields />
        </div>
      </div>
    </div>
  );
};
