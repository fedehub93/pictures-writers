import { describe, expect, it } from "vitest";

import { CREATE_CUSTOMER_NODE_TYPE } from "@/modules/customers/automations/constants";
import {
  CREATE_ORDER_NODE_TYPE,
  ORDER_COMPLETED_NODE_TYPE,
} from "@/modules/orders/automations/constants";

import {
  editorActionNodes,
  editorTriggerNodes,
  findCatalogEntry,
} from "../node-catalog";

describe("editor node catalog", () => {
  it("exposes the order automation nodes in the palette", () => {
    const actionTypes = editorActionNodes.map((entry) => entry.type);
    const triggerTypes = editorTriggerNodes.map((entry) => entry.type);

    expect(actionTypes).toEqual(
      expect.arrayContaining([
        CREATE_CUSTOMER_NODE_TYPE,
        CREATE_ORDER_NODE_TYPE,
      ]),
    );
    expect(triggerTypes).toContain(ORDER_COMPLETED_NODE_TYPE);
  });

  it("resolves a label for each new node", () => {
    expect(findCatalogEntry(CREATE_CUSTOMER_NODE_TYPE)?.label).toBe(
      "Create customer",
    );
    expect(findCatalogEntry(CREATE_ORDER_NODE_TYPE)?.label).toBe(
      "Create order",
    );
    expect(findCatalogEntry(ORDER_COMPLETED_NODE_TYPE)?.label).toBe(
      "Order completed",
    );
  });
});
