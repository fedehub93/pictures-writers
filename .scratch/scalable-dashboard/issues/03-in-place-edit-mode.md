# 03: In-place edit mode (reorder, hide, library, save)

**What to build:** A user can enter an edit mode and tailor their dashboard: reorder widgets by dragging, hide widgets, and add widgets from a permission-filtered library. Changes are persisted explicitly with Salva, or discarded with Annulla.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A Modifica/Fine toggle enters and leaves edit mode.
- [ ] Widgets can be reordered by dragging with `@dnd-kit/react`; the order persists per user.
- [ ] Each card can be hidden with an X; hidden instances remain re-addable from the library.
- [ ] A `+` tile opens a permission-filtered widget library; selecting an entry adds an instance.
- [ ] Widgets keep rendering real data, but their interactions are disabled while editing.
- [ ] Salva persists the layout for the current user; Annulla discards the changes.
- [ ] Saving requires `dashboard.read` and affects only the current user's layout.
- [ ] After save, the computed layout reflects the user's order and hidden set.
