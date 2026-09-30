import type { AutomationNodeCatalogEntry } from "@/modules/automations/lib/node-catalog";

import { SEND_EMAIL_NODE_TYPE, SUBSCRIPTION_CONFIRMED_NODE_TYPE } from "./constants";
import type { SubscriptionConfirmedPayload } from "./types";

/** Palette entry the mails module contributes for the Send Email action. */
export const sendEmailNodeCatalogEntry: AutomationNodeCatalogEntry = {
  type: SEND_EMAIL_NODE_TYPE,
  label: "Send email",
  description: "Send an email through the configured mail settings.",
  category: "action",
};

/**
 * Default `data` the editor seeds for a new `subscription.confirmed` trigger.
 *
 * It mirrors the payload the runtime hands to the Run, so expression
 * assistance can point at `{{ payload.email }}` (and `{{ payload.confirmedAt }}`)
 * out of the box; publishing needs no manual entry because the trigger takes
 * no required configuration.
 */
export const subscriptionConfirmedTriggerDefaultData: SubscriptionConfirmedPayload =
  {
    email: "",
    contactId: "",
    confirmedAt: "",
  };

/** Palette entry the mails module contributes for the `subscription.confirmed` trigger. */
export const subscriptionConfirmedTriggerCatalogEntry: AutomationNodeCatalogEntry =
  {
    type: SUBSCRIPTION_CONFIRMED_NODE_TYPE,
    label: "New subscription",
    description:
      "Starts the flow when someone confirms their email subscription.",
    category: "trigger",
    defaultData: subscriptionConfirmedTriggerDefaultData,
  };
