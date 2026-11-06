# 03: Single-source the region palettes and categories

**What to build:** One region palette definition owns the named tuples for layout, brand, content, header-only and footer-only blocks. The Header and Footer editor palettes, the Header and Footer public render palettes and the editor categories all derive from those tuples. The region configuration modules are grouped in one region-focused area, and a test fails if an editor palette and the corresponding public render palette diverge.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Each Site region's editor palette and public render palette expose exactly the same block names.
- [ ] Editor categories derive from the same tuples and never list a block outside that region's palette.
- [ ] Header-only blocks remain absent from the Footer and from pages; footer-only blocks remain absent from the Header and from pages.
- [ ] An invariant test fails when an editor palette and the matching public render palette disagree.
- [ ] The page palette remains explicit and unchanged.
- [ ] Region palette and region config modules are grouped together.
