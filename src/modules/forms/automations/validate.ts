import { isTriggerNodeType } from "@/modules/automations/lib/graph";
import type { NodeValidator } from "@/modules/automations/lib/validate";

import { FORM_SUBMITTED_TRIGGER_TYPE } from "./constants";
import { readConfiguredFormId } from "./lib/form-submitted-config";

/**
 * Publish-time check for the `form.submitted` trigger: it must be scoped to a
 * form, so an Automation never fires for every submission by accident. The
 * rule lives in the forms module and is composed into validation by the caller.
 */
export const formSubmittedNodeValidator: NodeValidator = (node) => {
  if (!isTriggerNodeType(node.type ?? "", FORM_SUBMITTED_TRIGGER_TYPE)) {
    return null;
  }

  return readConfiguredFormId(node.data)
    ? null
    : "Select the form that should trigger the 'Form submitted' trigger";
};
