import type { Config } from "@puckeditor/core";

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
import { TopBar } from "./blocks/TopBar";
import { SearchBar } from "./blocks/SearchBar";
import { NavbarBlock } from "./blocks/NavbarBlock";

import type { FormProps } from "./fields/form";

import { HeaderRootEditor } from "./root/header";
import { createPageEditorRoot } from "./root/page-editor";
import {
  FOOTER_REGION_COMPONENTS,
  HEADER_REGION_COMPONENTS,
  pickComponentConfigs,
} from "./region/palettes";

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
 * This is the single component registry of the Puck layer. Keeping the map
 * here (rather than exporting every block again) lets the region editor build
 * its restricted palettes from the same field definitions the regular builder
 * uses.
 *
 * The module deliberately contains no Puck editor component and no editor CSS:
 * the editor shell lives in `editor-shell.tsx`, so modules that only need the
 * registry or the document types do not pull in the editor runtime. Editor-only
 * behaviour is applied by the shell, not registered here: the text editing gate
 * (`editor/text-edit-mode/`) wraps the text blocks when `PuckEditor` builds the
 * editor config, and the public render config keeps each block's pure render.
 *
 * A block whose published render has to stay on the server (Link list,
 * Copyright) still appears here like every other block, but declares its own
 * editor render in its `index.tsx`: the same pure render, called with
 * `editing: puck.isEditing`. The public entry in `render-config.tsx` keeps the
 * server-safe render, so the editor-only behaviour lives in the client graph
 * and the published page ships no JavaScript for the block. The shared block UI
 * stays free of `"use client"`; the same module is compiled into both graphs
 * and both paths emit the same markup. A new editor-only behaviour on a
 * server-rendered block follows this shape — do not add a third render entry
 * and do not wrap the shared UI in a client boundary.
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
  TopBar,
  SearchBar,
  NavbarBlock,
};

export type PageEditorConfig = Config<HydratedComponents, RootProps>;

/**
 * Page palette. `Text` is shared with Site regions; footer-only blocks stay out
 * of pages by simply not being listed here. The map is derived from the
 * canonical registry above so a block definition only has to change once.
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

/**
 * Read-only palettes used by the page editor to draw the Site layout preview.
 *
 * They are built here, from the canonical registry, instead of importing
 * `region/editor-config.tsx`: that module already imports this one, so using
 * them here would create an import cycle. The roots match the region editors
 * so the Site layout preview renders the same tree the author sees there.
 */
const siteLayoutHeaderConfig: Config = {
  components: pickComponentConfigs(
    HEADER_REGION_COMPONENTS,
    editorComponentConfigs,
  ),
  root: HeaderRootEditor,
};

const siteLayoutFooterConfig: Config = {
  components: pickComponentConfigs(
    FOOTER_REGION_COMPONENTS,
    editorComponentConfigs,
  ),
  root: RootEditor,
};

// Create Puck component config
export const config: PageEditorConfig = {
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
  ) as PageEditorConfig["components"],
  root: createPageEditorRoot({
    header: siteLayoutHeaderConfig,
    footer: siteLayoutFooterConfig,
  }),
};
