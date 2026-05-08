import { PageUpdateValues } from "@/app/(admin)/admin/(routes)/pages/schema";
import { Config, Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { Grid, GridProps } from "./blocks/Grid";
import { Heading, HeadingProps } from "./blocks/Heading";

type Components = {
  Grid: GridProps;
  Heading: HeadingProps;
};

// Create Puck component config
const config: Config<Components> = {
  categories: {
    layout: {
      title: "Layout",
      components: ["Grid"],
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
    Grid,
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

  return <Puck config={config} data={initialData} onPublish={onSave} />;
}
