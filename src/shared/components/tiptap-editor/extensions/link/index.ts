import { Link } from "@tiptap/extension-link";
import { ReactMarkViewRenderer } from "@tiptap/react";

import { LinkButton } from "./ui/LinkButton";

export const CustomLink = Link.extend({
  parseHTML() {
    return [
      {
        tag: "a[href]",
        getAttrs: (element) => {
          let href = element.getAttribute("href") ?? "";

          if (href.startsWith(process.env.NEXT_PUBLIC_APP_URL!)) {
            href = href.replace(process.env.NEXT_PUBLIC_APP_URL!, "");
            element.setAttribute("href", href);
          }

          const relAttr = element.getAttribute("rel") ?? "";
          const relValues = relAttr.split(/\s+/);
          const nofollow = relValues.includes("nofollow");

          return {
            href,
            nofollow,
          };
        },
      },
    ];
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      nofollow: {
        default: true,
        renderHTML: (attributes) => {
          if (attributes.nofollow) {
            // Aggiungi anche noopener noreferrer se vuoi
            return { rel: "nofollow noopener noreferrer" };
          }
          return {};
        },
      },
    };
  },

  addMarkView() {
    return ReactMarkViewRenderer(LinkButton);
  },
});
