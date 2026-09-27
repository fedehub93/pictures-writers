import {
  passthroughHandler,
  type AutomationNodeRegistry,
} from "@/modules/automations/lib/node-registry";

/**
 * Handlers contributed by the forms module. The `form.submitted` trigger is a
 * passthrough: the Run payload already is the token, so the trigger Step just
 * forwards it to its successors. Registered here (not in the engine) so the
 * engine core stays free of form semantics (ADR-0005).
 */
export const formSubmittedNodeRegistry: AutomationNodeRegistry = {
  form_submitted: passthroughHandler,
};
