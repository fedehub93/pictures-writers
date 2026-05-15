import { type Config, type Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { PageUpdateValues } from "@/app/(admin)/admin/(routes)/pages/schema";

import { RootEditor, type RootProps } from "./root";

import { GridBlock, type GridBlockProps } from "./blocks/Grid";
import { SeparatorBlock, type SeparatorBlockProps } from "./blocks/Separator";
import { ImageBlock, type ImageBlockProps } from "./blocks/Image";
import { FormBlock, type FormBlockProps } from "./blocks/Form";
import { Heading, type HeadingProps } from "./blocks/Heading";

import { viewports } from "./utils/viewports";

type Components = {
  Grid: GridBlockProps;
  Image: ImageBlockProps;
  Form: FormBlockProps;
  Separator: SeparatorBlockProps;
  Heading: HeadingProps;
};

// Create Puck component config
const config: Config<Components, RootProps> = {
  categories: {
    layout: {
      title: "Layout",
      components: ["Grid", "Image", "Form", "Separator"],
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
    Form: FormBlock,
    Separator: SeparatorBlock,
    Heading,
  },
  root: RootEditor,
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
