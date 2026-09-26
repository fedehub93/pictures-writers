import type { AutomationNodeCatalogEntry } from "@/modules/automations/lib/node-catalog";

import { SEND_EMAIL_NODE_TYPE } from "./constants";

/** Palette entry the mails module contributes for the Send Email action. */
export const sendEmailNodeCatalogEntry: AutomationNodeCatalogEntry = {
  type: SEND_EMAIL_NODE_TYPE,
  label: "Send email",
  description: "Send an email through the configured mail settings.",
  category: "action",
};
