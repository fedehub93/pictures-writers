import { PageUpdateValues } from "@/app/(admin)/admin/(routes)/pages/schema";
import { Config, Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { GridBlock, GridBlockProps } from "./blocks/Grid";
import { Heading, HeadingProps } from "./blocks/Heading";
import { ImageBlock, ImageBlockProps } from "./blocks/Image";
import { viewports } from "./utils/viewports";

type Components = {
  Grid: GridBlockProps;
  Image: ImageBlockProps;
  Heading: HeadingProps;
};

// Create Puck component config
const config: Config<Components> = {
  categories: {
    layout: {
      title: "Layout",
      components: ["Grid", "Image"],
    },
    typography: {
      title: "Typography",
      components: ["Heading"],
    },
    actions: {
      title: "Actions",
    },
  },
  components: {
    Grid: GridBlock,
    Image: ImageBlock,
    Heading,
  },
};

export type PuckEditorProps = {
  id: string;
  initialData: Data;
  onSavePage: (values: PageUpdateValues) => void;
};

// Render Puck editor
export function PuckEditor({ id, initialData, onSavePage }: PuckEditorProps) {
  const onSave = async (data: Data) => {
    onSavePage({ id, puckData: data });
  };

  return (
    <Puck
      config={config}
      data={initialData}
      onPublish={onSave}
      viewports={viewports}
    />
  );
}
