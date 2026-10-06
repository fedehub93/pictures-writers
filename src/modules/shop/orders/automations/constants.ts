/**
 * UI node type of the `CREATE_ORDER` action contributed by the orders module.
 * The engine canonicalises it to `create_order` and dispatches to the handler
 * registered under `createOrder`.
 */
export const CREATE_ORDER_NODE_TYPE = "CREATE_ORDER";

/**
 * UI node type of the internal `order.completed` trigger. The orders module
 * owns it; the engine recognises it by the `*_TRIGGER` naming convention and
 * canonicalises it to `order_completed`.
 */
export const ORDER_COMPLETED_NODE_TYPE = "ORDER_COMPLETED_TRIGGER";

/// Canonical trigger event name persisted on the Run (`AutomationRun.triggerType`).
export const ORDER_COMPLETED_TRIGGER_TYPE = "order.completed";
