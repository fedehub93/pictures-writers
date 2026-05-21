import { Bold } from "@tiptap/extension-bold";

export const CustomBold = Bold.extend({
  parseHTML() {
    return [
      // ✅ mantiene supporto per <strong> e <b>
      { tag: "strong" },
      { tag: "b", getAttrs: () => null },
      {
        // ✅ cattura inline style con font-weight
        style: "font-weight",
        getAttrs: (value) => {
          // normalizza la stringa del valore CSS
          const weight = parseInt(value.toString(), 10);
          // considera bold solo >= 800
          if (weight >= 800) return {};
          return false; // non applicare mark
        },
      },
    ];
  },
});
