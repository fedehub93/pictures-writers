import { Puck } from "@puckeditor/core";

import { PuckBuilder } from "./builder";
import { BuilderHeader } from "./header";
import { ElementsPanel } from "./sidebar";

export const Editor = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-3.75rem)] overflow-hidden">
      <BuilderHeader />
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
