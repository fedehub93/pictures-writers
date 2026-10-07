import type { AutomationNodeCatalogEntry } from "@/modules/automations/lib/node-catalog";

import { CREATE_CUSTOMER_NODE_TYPE } from "./constants";

/**
 * Palette entry the customers module contributes for the `CREATE_CUSTOMER`
 * action. The `defaultData` primes the config panel with the common
 * form-submission expressions.
 */
export const createCustomerNodeCatalogEntry: AutomationNodeCatalogEntry = {
  type: CREATE_CUSTOMER_NODE_TYPE,
  label: "Create customer",
  description: "Creates or updates a customer from the flow data.",
  category: "action",
  defaultData: {
    email: "{{ payload.email }}",
    name: "{{ payload.data.name }}",
    phone: "",
    notes: "",
  },
};
