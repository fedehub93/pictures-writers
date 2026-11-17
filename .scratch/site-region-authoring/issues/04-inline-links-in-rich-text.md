---
Status: done
Type: task
Blocked by:
---

# Inline links in rich text

## Goal

Allow a link inside a sentence edited with the rich text field, so the Top bar heading can end with "Scopri il Laboratorio →" as a link instead of splitting the sentence into two blocks.

## Acceptance criteria

- [x] The rich text field registers the TipTap link mark with safe protocols (`http`, `https`, `mailto`, `tel`) and no automatic `target` guessing.
- [x] The editor toolbar and the inline bubble expose a link control: set, edit, remove, open in new tab.
- [x] `Heading`'s public render config declares the same link mark as the editor config, so the canvas and the public site produce the same markup.
- [x] A link inside a Heading renders as an anchor with the authored href, and `rel`/`target` only when authored.
- [x] Links already present in post/product bodies keep rendering unchanged.
- [x] Tests: rich text round-trip with a link mark; Heading renders the anchor in both configs; a disallowed protocol is not turned into an anchor.

## Implementation notes

- **One mark, one descriptor.** `rich-text/link.ts` owns `RichTextLinkMark`; `rich-text/extensions.ts` exports both the extension list and `richTextFieldConfig` (`options: { link: false }` plus the extensions). The editor field and the `Heading` entry in `src/puck/render-config.tsx` spread the same object, so the canvas and the public render cannot drift.
- **Puck's built-in link is disabled** with `link: false`; the explicit mark is the only `link` in the schema, avoiding duplicate-extension warnings.
- **Strict allow-list.** `Link.configure`'s `protocols` only adds to TipTap's built-in list (which also accepts `ftp:`, `sms:` and friends), so the mark overrides `isAllowedUri` with `isSafeRichTextHref`: exactly `http`, `https`, `mailto`, `tel`, plus relative/anchor URLs. Whitespace is stripped before the check to stop `java\nscript:` smuggling.
- **No guessed attributes.** Null `target`/`rel`/`class` override TipTap's `_blank` + `noopener noreferrer nofollow` defaults. A stored mark with a disallowed href renders its text inside a `span`, not an anchor.
- **Control.** `LinkPickerPopover` adds an "Add/Edit link" button to both `renderMenu` and `renderInlineMenu`: URL input, "Open in new tab" (the only way `target`/`rel` are authored), Open (preview in a new browser tab), Remove, Apply. Unsafe URLs leave the popover open instead of silently doing nothing.
- **Post/product bodies untouched:** `src/shared/components/tiptap-renderer/` and `CustomLinkMarkRenderer` are unchanged.

## Verification

- `npx tsc --noEmit` clean.
- `npx vitest run src/puck/__tests__`: 21 files / 153 tests pass.
- `npm run test:run`: 227 files / 1891 tests pass.
- ESLint on the changed files reports only pre-existing `any` warnings in `render-config.tsx`.

## Notes

- `@tiptap/extension-link` is now a direct dependency (`^3.31.3`) instead of being reached through `@tiptap/starter-kit` / Puck's transitive tree.
- The mark deliberately does not define the `nofollow` attribute used by `CustomLinkMarkRenderer`: Heading content is rendered through Puck's own HTML path, while post/product bodies keep their existing renderer.
