import {
  SearchIcon,
  ChevronDownIcon,
  GripIcon,
  InfoIcon,
  SquareIcon,
} from "lucide-react";
import { Config, createUsePuck, Drawer, Puck } from "@puckeditor/core";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";

import { ELEMENT_ICONS, ELEMENT_LABELS } from "./element-meta";
import { EditorRootEntry } from "../components/editor-root-entry";
import { useEditorRootEntry } from "../components/use-editor-root-entry";

const usePuck = createUsePuck<Config>();

export const ElementsPanel = ({ rootLabel }: { rootLabel: string }) => {
  const config = usePuck((state) => state.config);
  const rootEntry = useEditorRootEntry();
  const elements = Object.keys(config.components).map((name) => ({
    name,
    label: ELEMENT_LABELS[name] ?? name,
    icon: ELEMENT_ICONS[name] ?? SquareIcon,
  }));

  return (
    <div className="flex flex-col w-full h-full bg-background">
      {/* Header: shrink-0 previene la compressione */}
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
          <TabsTrigger
            value="globals"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:shadow-none text-muted-foreground text-xs h-full"
          >
            Globals
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="widgets"
          className="flex-1 m-0 overflow-hidden outline-none data-[state=active]:flex flex-col"
        >
          {/* ScrollArea ha dimensioni piene, il padding è gestito dal div interno */}
          <ScrollArea className="h-full w-full">
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-6">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Widget..."
                  className="pl-9 bg-background shadow-sm border-muted-foreground/30 text-sm"
                />
              </div>

              {/* Accordion / Category Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                  <ChevronDownIcon className="h-4 w-4" />
                  Atomic Elements
                </div>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 font-normal text-xs px-2 py-0.5 rounded-full bg-muted/30"
                >
                  New
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </Badge>
              </div>

              {/* Elements Grid */}
              <Drawer>
                <div className="grid grid-cols-2 gap-3 pb-8">
                  {elements.map((element) => (
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
              </Drawer>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent
          value="outline"
          className="flex-1 m-0 overflow-hidden outline-none data-[state=active]:flex flex-col"
        >
          <div className="shrink-0 p-1">
            <EditorRootEntry
              variant="row"
              rootLabel={rootLabel}
              {...rootEntry}
            />
          </div>
          <Puck.Outline />
        </TabsContent>
      </Tabs>
    </div>
  );
};
