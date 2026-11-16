import "client-only";

import { useState } from "react";
import { Config, createUsePuck, Puck } from "@puckeditor/core";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { ElementsPalette } from "./element-palette";

const usePuck = createUsePuck<Config>();

/**
 * The editor's left column: the palette drawn from the config's categories,
 * and Puck's outline.
 *
 * There is deliberately no "Globals" tab: it had no content. Every tab here
 * renders something.
 */
export const ElementsPanel = () => {
  const config = usePuck((state) => state.config);
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col w-full h-full bg-background">
      <div className="py-4 text-center font-bold text-base border-b shrink-0">
        Elements
      </div>

      {/* Tabs: min-h-0 permette al flex-1 di non sforare l'altezza dello schermo */}
      <Tabs defaultValue="widgets" className="flex-1 flex flex-col min-h-0">
        {/* TabsList: shrink-0 previene la compressione */}
        <TabsList className="w-full flex justify-around rounded-none border-b bg-transparent h-12 p-0 shrink-0">
          <TabsTrigger
            value="widgets"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none font-semibold text-xs h-full"
          >
            Widgets
          </TabsTrigger>
          <TabsTrigger
            value="outline"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none text-muted-foreground text-xs h-full"
          >
            Outline
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="widgets"
          className="flex-1 m-0 overflow-hidden outline-none data-[state=active]:flex flex-col"
        >
          {/* The scroll area fills the tab; the palette owns its padding. */}
          <ScrollArea className="h-full w-full">
            <ElementsPalette
              config={config}
              search={search}
              onSearchChange={setSearch}
            />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="outline">
          <Puck.Outline />
        </TabsContent>
      </Tabs>
    </div>
  );
};
