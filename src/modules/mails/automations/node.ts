import { toJsonValue } from "@/modules/automations/lib/graph";
import {
  AutomationNodeError,
  type AutomationNodeHandler,
  type AutomationNodeRegistry,
} from "@/modules/automations/lib/node-registry";

import {
  MissingSendEmailConfigError,
  resolveSendEmailConfig,
} from "./lib/send-email-config";

/**
 * Executor for the Send Email action.
 *
 * The node is deliberately thin: it interpolates its configuration from the
 * run context and delegates delivery to the injected `mail` effect, so tests
 * can swap in an in-memory recorder and the runtime can wire the real mail
 * pipeline. Template expressions in recipient/subject/body are resolved here,
 * before the effect is called.
 */
export const sendEmailHandler: AutomationNodeHandler = async (context) => {
  const { node, input, payload, run, step, effects } = context;

  let config;
  try {
    config = resolveSendEmailConfig(node.data, { input, payload, run, step });
  } catch (error) {
    if (error instanceof MissingSendEmailConfigError) {
      throw new AutomationNodeError(error.message, false);
    }
    throw error;
  }

  const output = await effects.mail(
    toJsonValue({
      config,
      input,
      payload,
      run,
      step,
    }),
  );

  return { output };
};

/// Handlers contributed by the mails module. `mergeNodeRegistries`
/// canonicalises `sendEmail` to `send_email`, matching the editor's
/// `SEND_EMAIL` node type.
export const sendEmailNodeRegistry: AutomationNodeRegistry = {
  sendEmail: sendEmailHandler,
};
