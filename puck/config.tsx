import { type Config, createUsePuck, type Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { Button } from "@/components/ui/button";

import { PageUpdateValues } from "@/app/(admin)/admin/(routes)/pages/schema";

import { RootEditor, type RootProps } from "./root";

import { GridBlock, type GridBlockProps } from "./blocks/Grid";
import { SeparatorBlock, type SeparatorBlockProps } from "./blocks/Separator";
import { ImageBlock, type ImageBlockProps } from "./blocks/Image";
import { FormBlock, type FormBlockProps } from "./blocks/Form";
import { Heading, type HeadingProps } from "./blocks/Heading";

import { viewports } from "./utils/viewports";
import { IconBlock, IconBlockProps } from "./blocks/Icon";

type Components = {
  Grid: GridBlockProps;
  Separator: SeparatorBlockProps;
  Icon: IconBlockProps;
  Image: ImageBlockProps;
  Form: FormBlockProps;
  Heading: HeadingProps;
};

// Create Puck component config
const config: Config<Components, RootProps> = {
  categories: {
    layout: {
      title: "Layout",
      components: ["Grid"],
    },
    basic: {
      title: "Basic",
      components: ["Icon", "Image", "Form", "Separator"],
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
    Separator: SeparatorBlock,
    Icon: IconBlock,
    Image: ImageBlock,
    Form: FormBlock,
    Heading,
  },
  root: RootEditor,
};

const usePuck = createUsePuck();

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
      overrides={{
        headerActions: ({ children }) => {
          const appState = usePuck((s) => s.appState);

          return (
            <>
              <Button type="button" onClick={() => onSave(appState.data)}>
                Save
              </Button>
            </>
          );
        },
      }}
    />
  );
}
