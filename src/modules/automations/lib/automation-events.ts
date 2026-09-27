import "server-only";

import { db } from "@/shared/lib/db";
import { AutomationStatus } from "@/generated/prisma";

import { enqueueRun } from "./automation-ingestion";
import { canonicalNodeType, parseAutomationGraph } from "./graph";

export interface EnqueueEventRunsInput {
  /**
   * Opaque, caller-chosen trigger event name. It is canonicalised only to match
   * the trigger node `type` in each published snapshot.
   */
  triggerType: string;
  /** Passed to `enqueueRun` untouched. */
  payload?: unknown;
  /** Opaque dedup key forwarded to `enqueueRun` (ADR-0005). */
  idempotencyKey?: string | null;
  now?: Date;
}

export interface EnqueueEventRunsResult {
  /** Ids of the Runs the event resolved to (existing ones on a dedup hit). */
  runIds: string[];
}

/**
 * Internal-event ingestion: start a Run for every published Automation whose
 * frozen graph contains a trigger node matching `triggerType`.
 *
 * The engine stays domain-agnostic: it only compares the opaque event name
 * against node types, passes the payload through verbatim, and forwards the
 * idempotency key to `enqueueRun`, which dedupes a non-terminal Run per
 * `(automationId, key)`. The meaning of the event, payload and key belongs to
 * the registering module (ADR-0005).
 */
export async function enqueueEventRuns(
  input: EnqueueEventRunsInput,
): Promise<EnqueueEventRunsResult> {
  const now = input.now ?? new Date();
  const eventType = canonicalNodeType(input.triggerType);

  const automations = await db.automation.findMany({
    where: { status: AutomationStatus.PUBLISHED },
    select: { id: true, publishedSnapshot: true },
  });

  const runIds: string[] = [];

  for (const automation of automations) {
    let matches = false;

    try {
      const graph = parseAutomationGraph(automation.publishedSnapshot);
      matches = graph.nodes.some(
        (node) => canonicalNodeType(node.type) === eventType,
      );
    } catch {
      continue;
    }

    if (!matches) {
      continue;
    }

    const run = await enqueueRun(
      {
        automationId: automation.id,
        triggerType: input.triggerType,
        payload: input.payload,
        idempotencyKey: input.idempotencyKey ?? null,
      },
      now,
    );

    if (run) {
      runIds.push(run.id);
    }
  }

  return { runIds };
}
