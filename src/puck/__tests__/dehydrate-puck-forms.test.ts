import { describe, expect, it } from "vitest";

import { dehydratePuckForms } from "../utils/dehydrate-puck-forms";

describe("dehydratePuckForms", () => {
  it("keeps unknown root props, including the legacy root title", () => {
    const data = {
      root: {
        props: {
          title: "Legacy root title",
          size: { desktop: { minHeight: "20rem" } },
        },
      },
      content: [],
    };

    const saved = dehydratePuckForms(data);

    expect(saved.root.props).toEqual({
      title: "Legacy root title",
      size: { desktop: { minHeight: "20rem" } },
    });
  });
});
