import { type Config, type Data, Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

import { RootEditor, type RootProps } from "./root";

import { ContainerBlock, type ContainerBlockProps } from "./blocks/Container";
import { FlexBlock, type FlexBlockProps } from "./blocks/Flex";
import { GridBlock, type GridBlockProps } from "./blocks/Grid";
import { SeparatorBlock, type SeparatorBlockProps } from "./blocks/Separator";
import { ImageBlock, type ImageBlockProps } from "./blocks/Image";
import { FormBlock, type FormBlockProps } from "./blocks/Form";
import { Heading, type HeadingProps } from "./blocks/Heading";
import { Text, type TextBlockProps } from "./blocks/Text";
import { LinkBlock, type LinkBlockProps } from "./blocks/Link";
import { IconBlock, type IconBlockProps } from "./blocks/Icon";
import { Brand } from "./blocks/Brand";
import { LinkList } from "./blocks/LinkList";
import { Copyright } from "./blocks/Copyright";

import { viewports } from "./utils/viewports";
import type { FormProps } from "./fields/form";

import { pickComponentConfigs } from "./region-palettes";
import { BREAKPOINTS } from "./utils/breakpoints";
import { Editor, type EditorHeaderProps } from "./editor/ui/view/editor";

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
  Text: TextBlockProps;
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
  Text: TextBlockProps;
  Link: LinkBlockProps;
};

/**
 * Editor component configs shared by pages and Site regions.
 *
 * Keeping the map here (rather than exporting every block again) lets the
 * region editor build its restricted palettes from the same field definitions
 * the regular builder uses.
 */
export const editorComponentConfigs: Config["components"] = {
  Container: ContainerBlock,
  Flex: FlexBlock,
  Grid: GridBlock,
  Separator: SeparatorBlock,
  Icon: IconBlock,
  Image: ImageBlock,
  Form: FormBlock,
  Heading,
  Text,
  Link: LinkBlock,
  Brand,
  LinkList,
  Copyright,
};

/**
 * Page palette. `Text` is shared with Site regions; footer-only blocks stay out
 * of pages by simply not being listed here.
 */
const PAGE_COMPONENT_NAMES = [
  "Container",
  "Flex",
  "Grid",
  "Separator",
  "Icon",
  "Image",
  "Form",
  "Heading",
  "Text",
  "Link",
] as const;

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
      components: ["Heading", "Text"],
    },
    actions: {
      title: "Actions",
    },
  },
  components: pickComponentConfigs(
    PAGE_COMPONENT_NAMES,
    editorComponentConfigs,
  ) as Config<HydratedComponents, RootProps>["components"],
  root: RootEditor,
};

export type PuckEditorProps = {
  initialData: {
    puckData: Data;
  };
  /**
   * Editor palette. Defaults to the page palette so existing callers keep
   * editing pages unchanged.
   */
  config?: Config;
  /**
   * Optional header override for callers that do not edit a Page (the Site
   * region editor provides its own title and save/publish actions).
   */
  header?: EditorHeaderProps;
};

// Render Puck editor
export function PuckEditor({
  initialData,
  config: editorConfig = config,
  header,
}: PuckEditorProps) {
  return (
    <Puck
      config={editorConfig}
      data={initialData.puckData}
      viewports={viewports}
      ui={{
        viewports: {
          current: {
            width: BREAKPOINTS.desktop.puckCanvasWidth,
            height: "auto",
          },
          options: viewports,
          controlsVisible: true,
        },
      }}
    >
      <Editor header={header} />
    </Puck>
  );
}
