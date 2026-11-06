# 04: Footer fields: Link list and Copyright with shared links editor

**What to build:** The Link list and Copyright blocks each configure their whole content in one section, and both use the same inline link editor. The Copyright block also previews the real Installation site name in the canvas. Link resolution and the current footer look stay unchanged.

**Blocked by:** 01 (editor controls and shared content-field wrapper), 02 (Installation settings metadata)

**Status:** ready-for-agent

- [ ] Link list exposes one Link list section controlling a nested `content` object with `title` and `links`.
- [ ] Copyright exposes one Copyright section controlling a nested `content` object with `showYear`, `extraText` and `links`.
- [ ] A shared inline links editor is used by both blocks, with the same add, remove, reorder and edit behaviour in each.
- [ ] The links editor reuses the existing link field so SmartLink targets resolve as before.
- [ ] The Copyright canvas render uses the metadata site name as a fallback, so the footer line previews the real name without a browser fetch.
- [ ] The public Copyright renderer still reads Installation settings on the server, and server-provided values take precedence over metadata.
- [ ] Existing link-resolution behaviour for resolved and unresolved entity links is preserved.
- [ ] Tests cover the nested content shapes, the shared links editor output, the metadata-driven Copyright preview, server-props precedence and link resolution.
- [ ] Type checking, targeted linting, the full test suite and the production build pass.
