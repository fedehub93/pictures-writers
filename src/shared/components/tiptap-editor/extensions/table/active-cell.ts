import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const activeTableCellKey = new PluginKey("activeTableCell");

export interface ActiveCellOptions {
  activeClassName: string;
}

export const activeCellOptions: ActiveCellOptions = {
  activeClassName: "table-cell-active",
};

export const ActiveTableCell = Extension.create<ActiveCellOptions>({
  name: "activeTableCell",

  addOptions() {
    return activeCellOptions;
  },

  addProseMirrorPlugins() {
    const { activeClassName } = this.options;
    return [
      new Plugin({
        key: activeTableCellKey,
        props: {
          decorations(state) {
            if (!state.selection.empty) return null;
            const $head = state.selection.$head;
            let start = -1;
            let end = -1;
            for (let depth = $head.depth; depth >= 1; depth -= 1) {
              const role = $head.node(depth).type.spec.tableRole;
              if (role === "cell" || role === "header_cell") {
                start = $head.before(depth);
                end = $head.after(depth);
                break;
              }
            }
            if (start < 0) return null;
            return DecorationSet.create(state.doc, [
              Decoration.node(start, end, {
                class: activeClassName,
              }),
            ]);
          },
        },
      }),
    ];
  },
});