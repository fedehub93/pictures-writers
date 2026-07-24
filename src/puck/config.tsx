import { EyeIcon, EyeOffIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { type Config, createUsePuck, type Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { Button } from "@/shared/ui/button";
import { ContentStatus } from "@/generated/prisma";

import { PageUpdateContentValues } from "@/modules/pages/schemas";

import { RootEditor, type RootProps } from "./root";

import { GridBlock, type GridBlockProps } from "./blocks/Grid";
import { SeparatorBlock, type SeparatorBlockProps } from "./blocks/Separator";
import { ImageBlock, type ImageBlockProps } from "./blocks/Image";
import { FormBlock, type FormBlockProps } from "./blocks/Form";
import { Heading, type HeadingProps } from "./blocks/Heading";

import { viewports } from "./utils/viewports";
import { IconBlock, IconBlockProps } from "./blocks/Icon";
import type { FormProps } from "./fields/form";

export type SavedComponents = {
  Grid: GridBlockProps;
  Separator: SeparatorBlockProps;
  Icon: IconBlockProps;
  Image: ImageBlockProps;
  Form: Omit<FormBlockProps, "form"> & {
    form: FormProps;
  };
  Heading: HeadingProps;
};

export type HydratedComponents = {
  Grid: GridBlockProps;
  Separator: SeparatorBlockProps;
  Icon: IconBlockProps;
  Image: ImageBlockProps;
  Form: FormBlockProps;
  Heading: HeadingProps;
};

// Create Puck component config
const config: Config<HydratedComponents, RootProps> = {
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

const usePuck = createUsePuck<typeof config>();

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
  onSavePage: (values: PageUpdateContentValues) => void;
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
        headerActions: ({ children }) => {
          const appState = usePuck((s) => s.appState);

          return (
            <>
              <div className="flex items-center gap-2">
                {true === true && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSaving || isPublishing}
                      onClick={() => onSave(appState.data)}
                    >
                      {isSaving && (
                        <Loader2Icon className="size-4 animate-spin" />
                      )}
                      {!isSaving && <SaveIcon className="size-4" />}
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSaving || isPublishing}
                      onClick={() => onPublish(id, rootId)}
                    >
                      {initialData.status !== ContentStatus.PUBLISHED && (
                        <>
                          {isPublishing && (
                            <Loader2Icon className="size-4 animate-spin" />
                          )}
                          {!isPublishing && <EyeIcon className="size-4" />}
                          Publish
                        </>
                      )}
                      {initialData.status === ContentStatus.PUBLISHED && (
                        <>
                          {isPublishing && (
                            <Loader2Icon className="size-4 animate-spin" />
                          )}
                          {!isPublishing && <EyeOffIcon className="size-4" />}
                          Unpublish
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </>
          );
        },
      }}
    />
  );
}
