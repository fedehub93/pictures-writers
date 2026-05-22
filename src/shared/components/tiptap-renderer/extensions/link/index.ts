import { Link } from "@tiptap/extension-link";

export const CustomLinkMarkRenderer = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      nofollow: {
        default: true,
        parseHTML: (element) => element.getAttribute("rel") === "nofollow",
        renderHTML: (attributes) => {
          if (attributes.nofollow) {
            return { rel: "nofollow" };
          }
          return {};
        },
      },
    };
  },
});
