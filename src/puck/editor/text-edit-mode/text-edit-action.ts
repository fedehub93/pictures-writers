import type {
  ComponentConfig,
  ComponentData,
  Permissions,
} from "@puckeditor/core";

import { contentFieldPath } from "./content-field";

/**
 * The two things the action can say.
 *
 * Words, not an icon: the button names a mode rather than a command, and on
 * touch it is the only way into that mode, so it has to be readable before it
 * is learned.
 */
export const TEXT_EDIT_ACTION_LABELS = {
  enter: "Edit text",
  exit: "Done",
} as const;

/** What the action bar knows about the block it is drawn for. */
export type TextEditTarget = {
  /** The block's id, or `null` while nothing is selected. */
  blockId: string | null;
  /** The block's config, which declares its fields. */
  config?: ComponentConfig<any> | null;
  /** The block's data: a field can be read-only per item. */
  item?: Pick<ComponentData, "readOnly"> | null;
  /** Puck's permissions for that block. */
  permissions?: Permissions | null;
};

export type TextEditAction = {
  /** The block the button opens. */
  blockId: string;
  /** `true` while this block's editor is in text editing mode. */
  editing: boolean;
  /** The button's text, which is also its accessible name. */
  label: string;
};

/**
 * Can this block offer a text editing mode?
 *
 * Three ways to say no, and the button must stay away for all of them: the
 * block has no content field (an Image, a Container whose text lives in its
 * slots), the field is declared non-editable, or the editor cannot edit this
 * block at all. The descriptor test is the one Puck's canvas transform applies,
 * so the button and the editor agree on what counts as a content field;
 * read-only fields and permissions are the rules this button adds on top.
 */
export function canEditText({
  config,
  item,
  permissions,
}: Omit<TextEditTarget, "blockId">): boolean {
  if (permissions?.edit === false) return false;

  const propPath = config ? contentFieldPath(config) : null;

  if (!propPath) return false;

  return item?.readOnly?.[propPath] !== true;
}

/**
 * The action bar's text action, or `null` when the block has nothing to open.
 *
 * A toggle, not a one-shot: the same button opens and closes the mode. Its
 * state is read from the editor store rather than kept here, which is what lets
 * it reflect a mode opened by a double click or by `Enter` — all three entries
 * write the same id.
 */
export function textEditAction({
  blockId,
  editingBlockId,
  ...target
}: TextEditTarget & { editingBlockId: string | null }): TextEditAction | null {
  if (!blockId || !canEditText(target)) return null;

  const editing = editingBlockId === blockId;

  return {
    blockId,
    editing,
    label: editing
      ? TEXT_EDIT_ACTION_LABELS.exit
      : TEXT_EDIT_ACTION_LABELS.enter,
  };
}
