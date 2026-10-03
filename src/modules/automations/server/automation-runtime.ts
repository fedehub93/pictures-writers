import "server-only";

import { createCustomerNodeRegistry } from "@/modules/customers/automations";
import { formSubmittedNodeRegistry } from "@/modules/forms/automations";
import {
  createAutomationMailEffect,
  createSequenceDeliveryPolicy,
  sendEmailNodeRegistry,
  subscriptionConfirmedNodeRegistry,
} from "@/modules/mails/automations";
import {
  createOrderNodeRegistry,
  orderCompletedNodeRegistry,
} from "@/modules/orders/automations";

import {
  runDueAutomations,
  type RunDueAutomationsResult,
} from "../lib/automation-runner";
import type { AutomationEffects } from "../lib/effects";
import {
  mergeNodeRegistries,
  type AutomationNodeRegistry,
} from "../lib/node-registry";
import { AUTOMATION_PUMP_MAX_BATCHES } from "../constants";
import {
  createAutomationHttpEffect,
  createAutomationLlmEffect,
  createAutomationWebSearchEffect,
} from "./action-effects";

/// Node registry contributed by feature modules. The engine core supplies its
/// own defaults, so only domain nodes are composed here (ADR-0005).
const moduleNodeRegistry: AutomationNodeRegistry = mergeNodeRegistries(
  sendEmailNodeRegistry,
  formSubmittedNodeRegistry,
  subscriptionConfirmedNodeRegistry,
  createCustomerNodeRegistry,
  createOrderNodeRegistry,
  orderCompletedNodeRegistry,
);

/**
 * App-level composition of the automation runtime: the concrete node registry
 * and effects the runner executes. Only composition lives here, so the engine
 * core (`lib/`) stays free of domain concepts (ADR-0005).
 */
export function createAutomationRuntimeEffects(): AutomationEffects {
  return {
    mail: createSequenceDeliveryPolicy(createAutomationMailEffect()),
    http: createAutomationHttpEffect(),
    webSearch: createAutomationWebSearchEffect(),
    llm: createAutomationLlmEffect(),
  };
}

export interface PumpDueAutomationsInput {
  now?: Date;
  /** Safety cap on consecutive batches; prevents a runaway drain. */
  maxBatches?: number;
  /** Test seam; defaults to the composed runtime. */
  registry?: AutomationNodeRegistry;
  effects?: AutomationEffects;
  /** Site IANA time zone; defaults to UTC when not supplied. */
  timeZone?: string;
}

export interface PumpDueAutomationsResult {
  batches: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

/**
 * Drain every currently-due Step.
 *
 * `runDueAutomations` snapshots the due set before executing, so a linear chain
 * only advances one node per call. Calling it repeatedly until nothing is due
 * lets a single pump (the cron tick, or "Run now") execute a whole chain up to
 * its first wait/retry. Bounded by `maxBatches`.
 */
export async function pumpDueAutomations(
  input: PumpDueAutomationsInput = {},
): Promise<PumpDueAutomationsResult> {
  const registry = input.registry ?? moduleNodeRegistry;
  const effects = input.effects ?? createAutomationRuntimeEffects();
  const maxBatches = Math.max(1, input.maxBatches ?? AUTOMATION_PUMP_MAX_BATCHES);

  const totals: PumpDueAutomationsResult = {
    batches: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  };

  for (let batch = 0; batch < maxBatches; batch++) {
    const result: RunDueAutomationsResult = await runDueAutomations({
      now: input.now,
      registry,
      effects,
      timeZone: input.timeZone,
    });

    totals.batches += 1;
    totals.processed += result.processed;
    totals.succeeded += result.succeeded;
    totals.failed += result.failed;
    totals.skipped += result.skipped;

    if (result.processed === 0) {
      break;
    }
  }

  return totals;
}
