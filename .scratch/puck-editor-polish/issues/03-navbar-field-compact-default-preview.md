# 03: Navbar field, compact default and Site region preview

**What to build:** The NavbarBlock configures its layout and menu tree in one Navigation section, new navbars start in the compact layout, and the Site region editor gains a Preview control that lets an editor open the mega menu panels while composing the header. Preview does not change the properties panel or the save behaviour, and pages do not get the control.

**Blocked by:** 01 (editor controls and shared content-field wrapper)

**Status:** ready-for-agent

- [ ] NavbarBlock exposes one Navigation section controlling a nested `content` object with `layout` and `items`.
- [ ] The Navigation section reuses the existing structured menu editor for the typed menu tree.
- [ ] New NavbarBlock instances default to the compact layout; `mega` remains available and already-saved documents keep their stored layout.
- [ ] The Site region editor header exposes a Preview control that toggles Puck between edit and interactive preview.
- [ ] The control shows the current state and a clear label for entering and leaving preview.
- [ ] The properties panel and saving keep working while preview is active.
- [ ] The page editor does not show the Preview control.
- [ ] Tests cover the nested navigation content shape, the compact default, and the preview control's next-state and label logic.
- [ ] The mega menu opening in interactive preview is verified manually in development.
- [ ] Type checking, targeted linting, the full test suite and the production build pass.
