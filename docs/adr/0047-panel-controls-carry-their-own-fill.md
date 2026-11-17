# The properties panel's controls carry their own fill

**Status**: accepted.

Everywhere in the backoffice a form control is transparent: the vendored `Input`, `Select` and `Textarea` set `bg-transparent` and let the surface behind them show through. That grammar works because an admin form sits on one surface. The editor's properties panel does not. It draws controls both on its own `bg-sidebar` surface and inside `bg-muted/60` groups that hold a family of related properties — Spacing, Border, Radius, the Layout modes — and a transparent control changes shade as it crosses into a group while a control painted `bg-background` does not. In one section the four border-width unit fields stayed light and the Border style select turned grey, and the panel looked assembled from two kits.

Two ways out: make every control transparent, or give every control its own fill. Transparency was the tempting one, because it is what the rest of the admin already does. It fails on the thing the panel exists for: contrast would then be a function of nesting. On the panel's surface the field would be one and a half percent lighter than the background; inside a group four and a half percent darker, with only the `--input` border holding it apart — and a field inside a group would read as a hole in the group rather than a control standing on it.

So the panel's controls share one fill: `PANEL_CONTROL.fill` is `bg-background` in the light theme and the primitives' own `dark:bg-input/30` tint in dark. It is applied at the call site, because the vendored primitives in `src/shared/ui/` are not edited (`CODING_STANDARDS.md`), and a token applied twice is still one decision. The fill is deliberately not folded into the box token: the unit input's inner `<input>` takes the box as well, and painting it would stack a second translucent layer over the group in dark mode.

The muted groups stay. They were never the defect — the controls that ignored them were.

## Considered options

- **Make every panel control transparent, like the rest of the admin.** Rejected: the fill then comes from whatever the control is drawn on, so the same field changes shade between sections, and the panel's own lightness step makes the field barely distinguishable from the panel outside a group.
- **Give every control a darker well (`bg-muted`) instead.** Rejected: it inverts the look of the chips that already exist and collides with the muted group a control is often drawn in — the field and its group would be the same colour.
- **Change the panel's surface to `bg-background` so transparent and opaque controls match.** Rejected: it removes the difference only on the panel itself, inside the groups the same control would still darken with the group.
- **Patch `Input`, `Select` and `Textarea` to take a panel fill.** Rejected: a local patch to a vendored file is erased the next time the component is reinstalled.

## Consequences

- The properties panel is the one backoffice surface where a form control is not transparent. That is the exception a reader will notice; `CODING_STANDARDS.md` states where a panel control's fill comes from, and this ADR states why it is not inherited.
- Every future panel control takes `PANEL_CONTROL.fill`, or a token that carries it, instead of choosing a background. A control added without one is a review finding, not a taste question.
- In dark the fill is the primitives' translucent tint, so it composites over the surface after all. The two surfaces it sits on differ by about one percent there, so the residual is imperceptible, while in the light theme the difference it removes was not.
- Admin forms outside the editor keep their transparent controls. Theirs is not the same defect and is not swept in: the panel is the only surface that draws controls inside muted groups.
- `GLOSSARY.md` → "Panel control".
