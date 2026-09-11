# 05: Remove the Slate sources and packages

**What to build:** The Slate stack disappears. The admin Slate editor subtree is deleted, the public Slate renderer tree is deleted, the orphaned legacy product-info component is deleted, and the five Slate npm packages are removed from dependencies. This is the contract step: it stays green because every reference was already removed in 02, 03, and 04.

**Blocked by:** 02, 03, 04 (no code may still reference Slate sources or packages).

**Status:** ready-for-agent

- [ ] The admin Slate editor subtree (editor core, editor-input, toolbar, plugins, element renderers, helpers) is deleted
- [ ] The public Slate renderer tree (renderer, elements, leaves, helpers) is deleted
- [ ] The orphaned legacy product-info component is deleted
- [ ] The five Slate packages are removed from `package.json`
- [ ] No file in the repository imports from any Slate package
- [ ] Build and lint pass