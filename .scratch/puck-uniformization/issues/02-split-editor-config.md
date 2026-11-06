# 02: Split the editor config registry from the editor shell

**What to build:** One canonical editor config module holds the component registry, the saved and hydrated document types and the page palette, with no dependency on the Puck editor component, the custom editor shell or the editor CSS. The Puck editor shell moves to its own module and consumes that registry. The obsolete duplicate config is deleted, and modules that only need types import them as type-only imports, removing the latent import cycle between the page header actions and the config.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Exactly one component registry and one set of saved/hydrated document types exist in the Puck layer.
- [ ] The config module has no dependency on the Puck editor component, the custom editor shell or the editor CSS.
- [ ] The editor shell module renders through the canonical registry and still supports an overridable header and a per-instance config.
- [ ] The page header actions no longer form an import cycle with the config module.
- [ ] The page builder and the Site region editor keep their external props and behaviour; type check, lint and tests pass.
