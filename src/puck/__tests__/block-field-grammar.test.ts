import { describe, expect, it } from "vitest";

import { editorComponentConfigs } from "../config";

/**
 * The panel has one grammar: every control is a custom field, or a slot.
 *
 * A native field type draws its own control and therefore escapes the panel's
 * compact box, its header and its reset affordance — the drift the Heading's
 * level used to be. The rich text field is the one native field a block may
 * declare: it is authored on the canvas, not in the panel, and it sets
 * `visible: false` for that reason.
 */
describe("the panel's field grammar", () => {
  it("draws every block field as a custom field or a slot", () => {
    for (const [blockName, component] of Object.entries(
      editorComponentConfigs,
    )) {
      for (const [fieldName, field] of Object.entries(component.fields ?? {})) {
        if (field.type === "richtext") continue;

        expect(
          ["custom", "slot"],
          `${blockName}.${fieldName} must be a custom field or a slot`,
        ).toContain(field.type);
      }
    }
  });
});
