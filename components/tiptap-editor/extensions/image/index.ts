import { ReactNodeViewRenderer } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";

import { EmbeddedImage } from "./ui/EmbeddedImage";

export const CustomImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(EmbeddedImage);
  },
});
