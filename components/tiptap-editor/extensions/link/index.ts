import { Link } from "@tiptap/extension-link";
import { ReactMarkViewRenderer } from "@tiptap/react";
import { LinkButton } from "./ui/LinkButton";


export const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rel: {
        default: null,
        parseHTML: (element) => element.getAttribute("rel"),
        renderHTML: (attributes) => {
          if (!attributes.rel) return {};
          return { rel: attributes.rel };
        },
      },
    };
  },
  addMarkView() {
    return ReactMarkViewRenderer(LinkButton);
  },
});
