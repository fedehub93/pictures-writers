---
Status: ready-for-agent
Type: task
Blocked by: 04-dragref-on-remaining-block-roots
---

# Hidden-block ghost without the wrapper

## What to build

A block hidden at the viewport being edited is drawn as a dashed ghost so it
stays selectable. The current rules key off Puck's wrapper being the parent of
the placeholder class:

```css
[data-puck-component]:has(> .puck-hidden-placeholder) { … }
```

With tickets 03 and 04 the placeholder class sits on the same element as
`data-puck-component`, so those rules stop matching and the ghost disappears.
Rewrite section 6 of `puck-base.css` for the new tree, keeping the three
behavioural promises: the block stays visible and selectable as a ghost, the
authored `display: none` still applies at every other width, and the label says
which breakpoint hides it.

## Acceptance criteria

- [ ] A block hidden at desktop is drawn as a dashed ghost at desktop, keeps its
      label, and still occupies no space on the published page.
- [ ] The same holds at tablet and mobile, and the ghost appears at exactly one
      canvas width per breakpoint (the media-query scoping is preserved).
- [ ] Clicking the ghost selects the block and opens its fields.
- [ ] Dragging a block into or out of the ghost's place still works.
- [ ] A block that is *not* hidden is never faded, outlined or labelled.
- [ ] The rule cannot reach the published page: the ghost classes are emitted
      only while editing.
- [ ] A regression test asserts the emitted classes for a hidden block in the
      editor path (the class list is the contract; the pixels are not).

## Notes

- Today the outline lives on the wrapper and the fade on the child, so the
  outline stays solid while the content fades. With a single element those two
  cannot be separated: decide whether the outline fades with the content (simpler,
  acceptable) or whether the fade moves to the block's children. Record the
  choice in the CSS comment.
- `getLayoutClassNames` emits `puck-hidden-placeholder` plus one
  `puck-hidden-at-*` marker; only the selectors around it change, not the
  contract it expresses.
