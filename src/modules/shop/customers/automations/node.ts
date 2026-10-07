import {
  AutomationNodeError,
  type AutomationNodeHandler,
  type AutomationNodeRegistry,
} from "@/modules/automations/lib/node-registry";

import { createOrUpdateCustomerByEmail } from "../server/create-customer";
import {
  MissingCreateCustomerConfigError,
  resolveCreateCustomerConfig,
} from "./lib/create-customer-config";

/**
 * Executor for the `CREATE_CUSTOMER` action.
 *
 * Thin by design: it interpolates its configuration from the run context and
 * delegates the write to the customers module's create-or-update service, so
 * the same semantics are shared with any future caller. The output carries the
 * `customerId` so a following `CREATE_ORDER` can reference it via `{{ input }}`.
 */
export const createCustomerHandler: AutomationNodeHandler = async (context) => {
  const { node, input, payload, run, step } = context;

  let config;
  try {
    config = resolveCreateCustomerConfig(node.data, { input, payload, run, step });
  } catch (error) {
    if (error instanceof MissingCreateCustomerConfigError) {
      throw new AutomationNodeError(error.message, false);
    }
    throw error;
  }

  const customer = await createOrUpdateCustomerByEmail(config);

  return {
    output: {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      notes: customer.notes,
    },
  };
};

/// Handlers contributed by the customers module. `mergeNodeRegistries`
/// canonicalises `createCustomer` to `create_customer`, matching the editor's
/// `CREATE_CUSTOMER` node type.
export const createCustomerNodeRegistry: AutomationNodeRegistry = {
  createCustomer: createCustomerHandler,
};
