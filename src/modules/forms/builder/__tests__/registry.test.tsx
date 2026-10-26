import { describe, expect, it } from "vitest";

import {
  FormElements,
  FormLayouts,
  FormDisplay,
  FormRoot,
  FormNodes,
} from "../registry";
import { FormNodeInstance } from "../types/core";

const isLazyComponent = (value: unknown) => {
  return (
    (value as { $$typeof?: symbol }).$$typeof === Symbol.for("react.lazy")
  );
};

describe("form builder registry", () => {
  it("lazy-loads every node's properties component", () => {
    Object.values(FormNodes).forEach((node) => {
      expect(
        isLazyComponent(node.propertiesComponent),
        `${node.type} propertiesComponent should be lazy`,
      ).toBe(true);
    });
  });

  it("keeps form and designer components eager", () => {
    Object.values(FormNodes).forEach((node) => {
      expect(
        isLazyComponent(node.formComponent),
        `${node.type} formComponent should not be lazy`,
      ).toBe(false);
      expect(
        isLazyComponent(node.designerComponent),
        `${node.type} designerComponent should not be lazy`,
      ).toBe(false);
    });
  });

  it("resolves schemas and initial values for every form element without loading properties", () => {
    Object.values(FormElements).forEach((element) => {
      const instance = element.construct("test-id") as FormNodeInstance;
      expect(instance.type).toBe(element.type);

      const schema = element.buildSchema(instance.properties as never);
      expect(schema).toBeDefined();

      const initialValue = element.getInitialValue(
        instance.properties as never,
      );
      expect(initialValue).toBeDefined();
    });
  });

  it("keeps a single registry of all nodes", () => {
    expect(Object.keys(FormNodes).sort()).toEqual(
      [
        ...Object.keys(FormRoot),
        ...Object.keys(FormElements),
        ...Object.keys(FormLayouts),
        ...Object.keys(FormDisplay),
      ].sort(),
    );
  });
});
