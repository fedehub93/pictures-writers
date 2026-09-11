import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import Image from "@tiptap/extension-image";
import type { Extensions } from "@tiptap/core";

import { InfoBoxNodeRenderer } from "./extensions/info-box";
import { ProductNodeRenderer } from "./extensions/product";
import { CustomLinkMarkRenderer } from "./extensions/link";
import { AdBlockNodeRenderer } from "./extensions/ads";
import { TableContentNodeRenderer } from "./extensions/table-content";
import { CustomHeading } from "./extensions/heading";

export const tiptapContentExtensions = [
  StarterKit.configure({
    heading: false,
    link: false,
    blockquote: {
      HTMLAttributes: {
        class: "not-prose",
      },
    },
  }),
  CustomHeading.configure({
    levels: [1, 2, 3, 4],
  }),
  CustomLinkMarkRenderer,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Youtube.configure({
    nocookie: true,
  }),
  Image,
  ProductNodeRenderer,
  InfoBoxNodeRenderer,
  AdBlockNodeRenderer,
  TableContentNodeRenderer,
] satisfies Extensions;
