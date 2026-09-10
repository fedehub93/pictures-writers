import { Extension, type Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey, type EditorState } from "@tiptap/pm/state";

import { createSlashCommands, filterSlashCommands } from "./slash-commands";
import { SlashMenu, type SlashMenuHandle } from "./slash-menu";
import type { SlashCommand, SlashCommandModalService } from "./types";

export interface SlashMenuExtensionOptions {
  modalService?: SlashCommandModalService;
  commands?: SlashCommand[];
}

/**
 * Determines whether the slash menu is allowed at the given document range.
 *
 * The menu opens only at the start of a text block or when `/` is immediately
 * preceded by a space.
 */
export const isSlashMenuAllowed = ({
  state,
  range,
}: {
  state: EditorState;
  range: Range;
}): boolean => {
  const $from = state.doc.resolve(range.from);
  const parentOffset = $from.parentOffset;

  if (parentOffset === 0) return true;

  const beforeSlash = $from.parent.textBetween(parentOffset - 1, parentOffset);
  return beforeSlash === " ";
};

/**
 * Tiptap extension that adds a Notion-style slash menu.
 *
 * The menu opens when `/` is typed at the start of a block or after a space,
 * and it allows the author to insert or transform text blocks without leaving
 * the writing flow.
 */
export const SlashMenuExtension = Extension.create<SlashMenuExtensionOptions>({
  name: "slashMenu",

  addOptions() {
    return {
      modalService: undefined,
      commands: undefined,
    };
  },

  addProseMirrorPlugins() {
    const commands =
      this.options.commands ?? createSlashCommands(this.options.modalService);

    return [
      Suggestion<SlashCommand, SlashCommand>({
        editor: this.editor,
        pluginKey: new PluginKey("slashMenu"),
        char: "/",
        allowSpaces: false,
        allowedPrefixes: [" "],
        startOfLine: false,
        minQueryLength: 0,

        /**
         * Only activate the slash menu at the start of a block or when the
         * character immediately before `/` is a space.
         */
        allow: isSlashMenuAllowed,

        command: ({ editor, range, props }) => {
          return props.execute(editor, range);
        },

        items: ({ query }) => filterSlashCommands(commands, query),

        render: () => {
          let component: ReactRenderer<SlashMenuHandle> | null = null;
          let unmount: (() => void) | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, {
                editor: props.editor,
                props: {
                  items: props.items,
                  command: props.command,
                },
              });
              unmount = props.mount(component.element);
            },

            onUpdate: (props) => {
              component?.updateProps({
                items: props.items,
                command: props.command,
              });
            },

            onKeyDown: (props) => {
              return component?.ref?.onKeyDown(props.event) ?? false;
            },

            onExit: () => {
              unmount?.();
              component?.destroy();
              component = null;
              unmount = null;
            },
          };
        },
      }),
    ];
  },
});

/**
 * Removes the slash query and executes a slash command at the current editor
 * position. This is the same path the suggestion plugin uses, exposed for
 * tests and programmatic callers.
 */
export const executeSlashCommand = (
  editor: Parameters<SlashCommand["execute"]>[0],
  command: SlashCommand,
  range: Range,
): boolean => command.execute(editor, range);
