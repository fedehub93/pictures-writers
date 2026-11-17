# A block's starting look is a class of Style variables, not an inline copy per instance

**Status**: accepted. Partially supersedes [ADR-0043](./0043-button-variant-is-data-not-a-class.md) on how a Variant is expressed: the variant remains one prop in the document, but its look stops being written into the inline `style` attribute. Applies [ADR-0044](./0044-size-and-spacing-style-fields.md)'s class-and-variables pipeline to the look a block starts from.

Every Button now carries its starting look as inline declarations. A freshly dropped primary emits about 44 Style variables, and 39 of them are the variant alone — 11 Decoration properties and 2 Typography properties, materialized at all three Breakpoints — identical on every Button of that variant anywhere on the site. The rest is the Button's own box: four paddings that arrive from the block's default props and are written onto the instance as if the author had painted them.

None of those values is a fact about the instance. The document already says which variant the Button is; the padding is the box a Button starts with. Repeating the resolved values on every instance buys nothing and costs the one thing the inline style attribute is good for: legibility. In a page with three calls to action, DevTools shows three identical forty-line blocks.

So the block's own root class declares them instead, as the same Style variables the render used to write: one class per Variant, carrying its base and its hover, plus the block's base box. An authored value still reaches the Block root inline, and an inline custom property outranks a class one, so "an authored value wins, at the Breakpoint it was authored at" is preserved — it is now an invariant of the stylesheet rather than a merge performed in the render. The hover stays what ADR-0043 made it: the only stateful rule, reading the state's own variables and falling back to a colour derived from the base one.

ADR-0043 rejected "the variant as a stylesheet class" because "the class owns a look the state variables cannot override". That reasoning holds for a class that declares **properties**, and such a class is not reachable here: `.puck-deco` declares the properties themselves, `background-color` with `!important`, so anything that wants to paint a block has to go through the variables. A class of **variables** is the same pipeline one specificity level lower — the state's variables, an authored value and a variant default all keep their relative order. What 0043 established stands: the variant is one prop, not a stored class name, and a state appends its own variables instead of redefining the base ones.

The Button's base box moves for a second reason. Written as default props, the padding is indistinguishable from an authored value, so an author who clears the field strips the Button of its box and it collapses. Declared by the class, the same empty field reads as "nothing authored here" and the Button keeps its box — the meaning the variant already gives an empty Decoration field.

The Width is the exception. Its constant is quoted by the Width control as the `block default`, so a class hard-coding it would give one value two sources; it stays inline.

## Considered options

- **Keep the look inline (ADR-0043's choice).** Rejected: 39 identical declarations per instance, the same values copy-pasted across every page, and a DOM that hides the five values that are actually the instance's own.
- **A class that declares the properties, the Tailwind way.** Rejected: `.puck-deco` owns those properties with `!important`, so the class would lose to an empty decoration, and an authored value would need a third mechanism to win. A second styling model for one block.
- **Generate the class rules from the TypeScript table at build time.** Rejected: a build step to produce four static rules, and the table's only remaining consumer would be the generator.
- **Leave the Button's padding in the default props.** Rejected: a cleared field then collapses the Button, and the panel keeps showing a value the author never wrote.
- **Move the Width too.** Rejected: the Width control quotes the same constant, so the class would duplicate a value the panel already knows.

## Consequences

- The render stops resolving the variant: the merge helper and the per-variant values disappear from TypeScript. The variant list, its default and the fallback for a value a stored document no longer matches are all that remain.
- The Button is the only block whose starting look is owned by a class. A second block that needs one brings its own class and its own arguments; the other blocks keep their default props.
- Tests that pinned the emitted Style variables per variant become tests of the stylesheet, read as data, plus render assertions that no variant variable is emitted inline. The rule that a variant class declares only custom properties — never a property, never `!important` — is the invariant to pin.
- A future "save these props as a Variant" would have to generate a rule rather than write into a table. It was out of scope before this decision and stays out of scope; nothing that ships today depends on it.
- A document that stored the Button's paddings keeps them and renders identically. A document that stored padding at one Breakpoint only gains the base box at the others: that is the clearing rule working, and it needs no migration.
- `GLOSSARY.md` → "Style variable", "Variant".
