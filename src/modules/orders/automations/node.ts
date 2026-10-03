import { TRPCError } from "@trpc/server";

import { OrderSource, OrderStatus } from "@/generated/prisma";
import {
  AutomationNodeError,
  passthroughHandler,
  type AutomationNodeHandler,
  type AutomationNodeRegistry,
} from "@/modules/automations/lib/node-registry";

import { createOrderRecord } from "../server/order-service";
import {
  MissingCreateOrderConfigError,
  resolveCreateOrderConfig,
} from "./lib/create-order-config";

/**
 * Executor for the `CREATE_ORDER` action.
 *
 * It interpolates its configuration from the run context and delegates to the
 * shared order service, so numbering, price snapshots and the pending offline
 * Payment match the admin form. Automation orders are created `PENDING` with
 * source `AUTOMATION`, ready for an admin to complete.
 */
export const createOrderHandler: AutomationNodeHandler = async (context) => {
  const { node, input, payload, run, step } = context;

  let config;
  try {
    config = resolveCreateOrderConfig(node.data, { input, payload, run, step });
  } catch (error) {
    if (error instanceof MissingCreateOrderConfigError) {
      throw new AutomationNodeError(error.message, false);
    }
    throw error;
  }

  try {
    const order = await createOrderRecord({
      customerId: config.customerId,
      items: config.items,
      notes: config.notes ?? null,
      source: OrderSource.AUTOMATION,
      status: OrderStatus.PENDING,
    });

    return {
      output: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
      },
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      throw new AutomationNodeError(error.message, false);
    }
    throw error;
  }
};

/// Handlers contributed by the orders module. `mergeNodeRegistries`
/// canonicalises `createOrder` to `create_order`, matching the editor's
/// `CREATE_ORDER` node type.
export const createOrderNodeRegistry: AutomationNodeRegistry = {
  createOrder: createOrderHandler,
};

/**
 * Handler for the `order.completed` trigger. The trigger is a passthrough: the
 * Run payload already is the token, so the trigger Step just forwards it to its
 * successors. Registered here (not in the engine) so the engine core stays free
 * of order semantics (ADR-0005).
 */
export const orderCompletedNodeRegistry: AutomationNodeRegistry = {
  order_completed: passthroughHandler,
};
