# 05: Keyboard layout control and announcements

**What to build:** A keyboard user can change a widget's size and move it without a pointer, and layout changes are announced to assistive technology, so arranging is not mouse-only.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] In edit mode each widget exposes a keyboard-accessible layout control that can change its width and height and move it up or down.
- [ ] The control steps through the widget's size presets as width/height stops and respects the definition's minimum and maximum bounds.
- [ ] Activating a stop updates the layout exactly as a pointer move/resize would, and persists through auto-save.
- [ ] Layout changes (move and resize) are announced through an `aria-live` region using the widget's effective title and its new position/size.
- [ ] The control is reachable and operable by keyboard alone, with sensible focus order in edit mode.
