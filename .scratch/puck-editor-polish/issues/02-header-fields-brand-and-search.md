# 02: Header fields: Brand and Search bar with settings preview

**What to build:** The Brand block and the Search bar block each expose one recognisable content section instead of native radio and text fields, and the Brand block previews the real Installation site name and logo in the canvas. Toggling the logo or the site name now has a visible effect while designing, and the public site keeps rendering from Installation settings exactly as before.

**Blocked by:** 01 (editor controls and shared content-field wrapper)

**Status:** ready-for-agent

- [ ] Brand exposes one Brand section controlling a nested `content` object with `showLogo`, `showSiteName`, `customText` and `customLogoUrl`.
- [ ] Search bar exposes one Search section controlling a nested `content` object with `placeholder` and `variant`.
- [ ] Both blocks no longer expose native radio or text fields for these props.
- [ ] The Site region editor passes the Installation site name and logo URL into the Puck editor as metadata.
- [ ] The Brand canvas render uses the metadata as a fallback when no server-provided site name or logo is present, so the logo and site-name toggles visibly add or remove content in the canvas.
- [ ] The public Brand renderer still reads Installation settings on the server, and server-provided values take precedence over metadata.
- [ ] The editor render remains database-free: no browser fetch and no database import in the canvas path.
- [ ] Tests cover the nested content shapes, the metadata-driven canvas preview, the server-props precedence, and the existing style variables and custom overrides.
- [ ] Type checking, targeted linting, the full test suite and the production build pass.
