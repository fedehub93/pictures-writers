import type { AutomationNodeCatalogEntry } from "@/modules/automations/lib/node-catalog";

import { FORM_SUBMITTED_NODE_TYPE } from "./constants";
import type { FormSubmittedPayload } from "./types";

/**
 * Default `data` the editor seeds for a new `form.submitted` trigger.
 *
 * It mirrors the payload the runtime hands to the Run, so expression
 * assistance can point at `{{ payload.email }}` (and `{{ payload.data.* }}`)
 * out of the box; publishing needs no manual entry because the trigger takes
 * no required configuration.
 */
export const formSubmittedTriggerDefaultData: FormSubmittedPayload = {
  formId: "",
  email: "",
  data: {},
  submittedAt: "",
};

/** Palette entry the forms module contributes for the `form.submitted` trigger. */
export const formSubmittedTriggerCatalogEntry: AutomationNodeCatalogEntry = {
  type: FORM_SUBMITTED_NODE_TYPE,
  label: "Form submitted",
  description: "Starts the flow when one of your forms is submitted.",
  category: "trigger",
  defaultData: formSubmittedTriggerDefaultData,
};
