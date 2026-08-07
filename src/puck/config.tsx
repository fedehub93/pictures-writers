import { type Config, type Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { ContentStatus } from "@/generated/prisma";

import { RootEditor, type RootProps } from "./root";

import { ContainerBlock, type ContainerBlockProps } from "./blocks/Container";
import { FlexBlock, type FlexBlockProps } from "./blocks/Flex";
import { GridBlock, type GridBlockProps } from "./blocks/Grid";
import { SeparatorBlock, type SeparatorBlockProps } from "./blocks/Separator";
import { ImageBlock, type ImageBlockProps } from "./blocks/Image";
import { FormBlock, type FormBlockProps } from "./blocks/Form";
import { Heading, type HeadingProps } from "./blocks/Heading";
import { LinkBlock, type LinkBlockProps } from "./blocks/Link";
import { IconBlock, type IconBlockProps } from "./blocks/Icon";
import { HeaderActions } from "./editor/ui/components/header-actions";

import { viewports } from "./utils/viewports";
import type { FormProps } from "./fields/form";

export type SavedComponents = {
  Container: ContainerBlockProps;
  Flex: FlexBlockProps;
  Grid: GridBlockProps;
  Separator: SeparatorBlockProps;
  Icon: IconBlockProps;
  Image: ImageBlockProps;
  Form: Omit<FormBlockProps, "form"> & {
    form: FormProps;
  };
  Heading: HeadingProps;
  Link: LinkBlockProps;
};

export type HydratedComponents = {
  Container: ContainerBlockProps;
  Flex: FlexBlockProps;
  Grid: GridBlockProps;
  Separator: SeparatorBlockProps;
  Icon: IconBlockProps;
  Image: ImageBlockProps;
  Form: FormBlockProps;
  Heading: HeadingProps;
  Link: LinkBlockProps;
};

// Create Puck component config
export const config: Config<HydratedComponents, RootProps> = {
  categories: {
    layout: {
      title: "Layout",
      components: ["Container"],
    },
    basic: {
      title: "Basic",
      components: ["Link", "Icon", "Image", "Form", "Separator"],
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
    Container: ContainerBlock,
    Flex: FlexBlock,
    Grid: GridBlock,
    Separator: SeparatorBlock,
    Icon: IconBlock,
    Image: ImageBlock,
    Form: FormBlock,
    Heading,
    Link: LinkBlock,
  },
  root: RootEditor,
};

export type PuckEditorProps = {
  initialData: {
    id: string;
    rootId: string;
    status: ContentStatus;
    slug: string;
    puckData: Data<HydratedComponents>;
  };
};

export function PuckEditor({ initialData }: PuckEditorProps) {
  return (
    <Puck
      config={config}
      data={initialData.puckData}
      viewports={viewports}
      overrides={{
        headerActions: () => {
          return <HeaderActions page={initialData} />;
        },
      }}
    />
  );
}
