import { type Config, type Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { ContentStatus } from "@/generated/prisma";

import type { PageUpdateValues } from "@/modules/pages/schemas";

import { RootEditor, type RootProps } from "./root";

import { GridBlock, type GridBlockProps } from "./blocks/Grid";
import { SeparatorBlock, type SeparatorBlockProps } from "./blocks/Separator";
import { ImageBlock, type ImageBlockProps } from "./blocks/Image";
import { FormBlock, type FormBlockProps } from "./blocks/Form";
import { Heading, type HeadingProps } from "./blocks/Heading";
import { LinkBlock, type LinkBlockProps } from "./blocks/Link";

import { viewports } from "./utils/viewports";
import { IconBlock, IconBlockProps } from "./blocks/Icon";
import type { FormProps } from "./fields/form";
import { HeaderActions } from "./header-actions";

export type SavedComponents = {
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
      components: ["Grid"],
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
  id: string;
  rootId: string;
  initialData: {
    title: string;
    slug: string;
    status: ContentStatus;
    puckData: Data<HydratedComponents>;
  };
  isSaving: boolean;
  isPublishing: boolean;
  onSavePage: (values: PageUpdateValues) => void;
  onPublish: (id: string, rootId: string) => void;
};

// Render Puck editor
export function PuckEditor({
  id,
  rootId,
  initialData,
  isSaving,
  isPublishing,
  onSavePage,
  onPublish,
}: PuckEditorProps) {
  const onSave = async (data: Data<HydratedComponents>) => {
    onSavePage({
      id,
      rootId,
      title: initialData.title,
      slug: initialData.slug,
      puckData: data,
    });
  };

  return (
    <Puck
      config={config}
      data={initialData.puckData}
      onPublish={onSave}
      viewports={viewports}
      overrides={{
        headerActions: () => {
          return (
            <HeaderActions
              id={id}
              rootId={rootId}
              initialData={initialData}
              isSaving={isSaving}
              isPublishing={isPublishing}
              onSave={onSave}
              onPublish={onPublish}
            />
          );
        },
      }}
    />
  );
}
