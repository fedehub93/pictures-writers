"use client";

import "client-only";

import type { ReactNode, SyntheticEvent } from "react";

import {
  ActionBar,
  createUsePuck,
  type ComponentConfig,
  type ComponentData,
  type Config,
  type Overrides,
  type Permissions,
} from "@puckeditor/core";

import { useEditorStore } from "@/puck/editor/store/use-editor-store";

import { textEditAction, type TextEditAction } from "./text-edit-action";
import { findBlockRoot, focusTextEditor } from "./text-editor-dom";

const usePuck = createUsePuck<Config>();

/** What Puck hands an `actionBar` override. */
export type TextEditActionBarProps = {
  label?: string;
  children: ReactNode;
  parentAction: ReactNode;
  dragHandle?: ReactNode;
};

export type ActionBarWithTextEditProps = TextEditActionBarProps & {
  /** The action to draw, or `null` when the block has no mode to offer. */
  action: TextEditAction | null;
  onToggle: (event: SyntheticEvent, action: TextEditAction) => void;
};

/**
 * Puck's action bar, plus the text action.
 *
 * The groups around it are Puck's own, in Puck's order: the parent action and
 * the label, the block's actions (the formatting toolbar while the editor is
 * armed, then duplicate and delete) and the drag handle. The text action takes
 * a group of its own before the handle, so nothing Puck draws moves and the
 * handle keeps the far right where Puck puts it.
 */
export function ActionBarWithTextEdit({
  label,
  children,
  parentAction,
  dragHandle,
  action,
  onToggle,
}: ActionBarWithTextEditProps) {
  const editing = action?.editing ?? false;

  return (
    <ActionBar>
      <ActionBar.Group>
        {parentAction}
        {label && <ActionBar.Label label={label} />}
      </ActionBar.Group>
      <ActionBar.Group>
        {/*
          Puck keeps the formatting toolbar mounted while its own richtext state
          names the block, and that state outlives the block: undo followed by
          redo brings a text block back with the toolbar already on it, on a
          locked block. The bar cannot clear a state it does not own, so it ties
          the toolbar to the mode instead: `data-text-edit-armed` exists only
          while the editor is open, and the stylesheet hides the menu without
          it. `display: contents` leaves Puck's actions as the group's own flex
          children, so the bar's layout is untouched.
        */}
        <div
          className="puck-text-edit-actions"
          data-text-edit-armed={editing || undefined}
        >
          {children}
        </div>
      </ActionBar.Group>
      {action && (
        <ActionBar.Group>
          {/*
            `data-text-edit-action` marks the button: `ActionBar.Action` keeps
            its own class to itself, and the stylesheet needs a hook for the one
            action that carries a word instead of an icon.
          */}
          <ActionBar.Action
            label={action.label}
            aria-pressed={editing}
            data-text-edit-action=""
            onClick={(event) => onToggle(event, action)}
          >
            {action.label}
          </ActionBar.Action>
        </ActionBar.Group>
      )}
      {dragHandle && <ActionBar.Group>{dragHandle}</ActionBar.Group>}
    </ActionBar>
  );
}

/**
 * Leave the mode, or open it.
 *
 * Closing goes through the store alone: the gate on the block hands the editor
 * back to Puck, collapses the DOM selection and focuses the block, exactly as
 * `Escape` does, so the block stays selected and nothing is left armed.
 *
 * Opening from here is the discoverable path and the only one touch has, since
 * a double tap is the browser's zoom. The caret goes to the end of the text —
 * a press on a button carries no point inside the text to measure.
 */
function toggleTextEdit(event: SyntheticEvent, action: TextEditAction) {
  const store = useEditorStore.getState();

  if (action.editing) {
    store.exitTextEditMode();
    return;
  }

  store.enterTextEditMode(action.blockId);

  const root = findBlockRoot(event.currentTarget.ownerDocument, action.blockId);

  if (root) focusTextEditor(root);
}

export type BlockActionBarProps = TextEditActionBarProps & {
  /** The block Puck has selected, or `null` while nothing is. */
  selectedItem: Pick<ComponentData, "type" | "props" | "readOnly"> | null;
  /** Its config from the editor registry. */
  config: ComponentConfig<any> | null;
  /** Puck's permissions for it. */
  permissions: Permissions | null;
};

/**
 * The bar for the selected block: the decision and the toggle, without Puck.
 *
 * Kept apart from the override so the whole decision can be mounted and driven
 * — which block, which field, which state — with the editor store and a block
 * root, and so the override stays the one place that reads Puck.
 */
export function BlockActionBar({
  selectedItem,
  config,
  permissions,
  ...barProps
}: BlockActionBarProps) {
  const editingBlockId = useEditorStore((state) => state.editingTextBlockId);

  const action = textEditAction({
    blockId: selectedItem?.props.id ?? null,
    config,
    item: selectedItem,
    permissions,
    editingBlockId,
  });

  return (
    <ActionBarWithTextEdit
      {...barProps}
      action={action}
      onToggle={toggleTextEdit}
    />
  );
}

/**
 * The editor's action bar.
 *
 * Puck draws an action bar for every block it hovers or selects, but only the
 * selected block's bar is visible and takes the pointer (Puck keeps the others
 * at `opacity: 0` with no pointer events). `selectedItem` is therefore the
 * block the visible bar belongs to — and it is the only identity an action bar
 * override gets: the `label` prop is a component name, which two headings
 * share.
 */
function TextEditActionBar(props: TextEditActionBarProps) {
  const selectedItem = usePuck((state) => state.selectedItem);
  const selectedConfig = usePuck((state) =>
    selectedItem
      ? ((state.config.components[selectedItem.type] as
          | ComponentConfig<any>
          | undefined) ?? null)
      : null,
  );
  // The resolver is read, not called, by the selector: it is a stable function,
  // and a call inside the selector would hand back a new object on every store
  // change and re-render every bar with it.
  const getPermissions = usePuck((state) => state.getPermissions);

  return (
    <BlockActionBar
      {...props}
      selectedItem={selectedItem}
      config={selectedConfig}
      permissions={selectedItem ? getPermissions({ item: selectedItem }) : null}
    />
  );
}

/**
 * The editor overrides this project installs.
 *
 * This is the project's first `overrides` entry, so it is worth writing down
 * what it is for and what it may not do.
 *
 * What it is for: the only way into text editing mode that does not depend on a
 * gesture the browser owns — a double click, which on touch is the browser's
 * zoom — and the way back out that the author can see. It adds one control and
 * changes nothing else: the bar is Puck's own layout, group by group.
 *
 * What it may not do: it does not replace the double click or `Enter` (all three
 * write the same id in the editor store, so the button reflects whichever one
 * opened the mode), it cannot see the block it is drawn for (Puck passes no id,
 * so `selectedItem` stands in), and it must not touch the document — the mode is
 * session state and never reaches the Puck data.
 */
export const textEditOverrides: Partial<Overrides<Config>> = {
  actionBar: TextEditActionBar,
};
