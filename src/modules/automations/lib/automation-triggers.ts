import "server-only";

import { db } from "@/shared/lib/db";
import type { AutomationRun } from "@/generated/prisma";
import { AutomationStatus } from "@/generated/prisma";

import { enqueueRun } from "./automation-ingestion";
import { canonicalNodeType, parseAutomationGraph } from "./graph";
import { isCronTriggerDue } from "./cron-schedule";
import { verifyWebhookSecret } from "./webhook-secret";

/**
 * Trigger evaluators that feed the single ingestion point (`enqueueRun`).
 *
 * The engine stays domain-agnostic: these helpers read the Automation's
 * published graph and, when a trigger is due/authenticated, hand the payload to
 * the ingestion point. Nothing here interprets the payload.
 */

export const CRON_TRIGGER_TYPE = "cron";
export const WEBHOOK_TRIGGER_TYPE = "webhook";
export const MANUAL_TRIGGER_TYPE = "manual";

export type CronEvaluationResult = {
  fired: string[];
};

/**
 * Enqueue a Run for every published Automation whose cron trigger interval has
 * elapsed since its most recent Run. Unpublished Automations never fire.
 */
export async function enqueueDueCronAutomations(
  options: { now?: Date } = {},
): Promise<CronEvaluationResult> {
  const now = options.now ?? new Date();

  const automations = await db.automation.findMany({
    where: {
      status: AutomationStatus.PUBLISHED,
    },
    select: { id: true, publishedSnapshot: true },
  });

  const fired: string[] = [];

  for (const automation of automations) {
    let cronNodes;
    try {
      const graph = parseAutomationGraph(automation.publishedSnapshot);
      cronNodes = graph.nodes.filter(
        (node) => canonicalNodeType(node.type) === CRON_TRIGGER_TYPE,
      );
    } catch {
      continue;
    }

    if (cronNodes.length === 0) {
      continue;
    }

    const lastRun = await db.automationRun.findFirst({
      where: { automationId: automation.id },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });

    const due = cronNodes.some((node) =>
      isCronTriggerDue(node.data, lastRun?.startedAt ?? null, now),
    );

    if (!due) {
      continue;
    }

    const run = await enqueueRun(
      {
        automationId: automation.id,
        triggerType: CRON_TRIGGER_TYPE,
        payload: { triggeredAt: now.toISOString() },
      },
      now,
    );

    if (run) {
      fired.push(run.id);
    }
  }

  return { fired };
}

export type WebhookEnqueueResult =
  | { status: "accepted"; runId: string }
  | { status: "ignored" }
  | { status: "unauthorized" };

/**
 * Authenticate a webhook caller against the Automation's stored secret hash and
 * start a Run whose payload is the request body. A missing/unknown Automation
 * and a bad secret are indistinguishable (both `unauthorized`) so existence is
 * not leaked.
 */
export async function enqueueWebhookRun(input: {
  automationId: string;
  secret: string | null;
  payload?: unknown;
  now?: Date;
}): Promise<WebhookEnqueueResult> {
  const automation = await db.automation.findUnique({
    where: { id: input.automationId },
    select: { webhookSecretHash: true },
  });

  if (
    !automation ||
    !verifyWebhookSecret(input.secret, automation.webhookSecretHash)
  ) {
    return { status: "unauthorized" };
  }

  const run: AutomationRun | null = await enqueueRun(
    {
      automationId: input.automationId,
      triggerType: WEBHOOK_TRIGGER_TYPE,
      payload: input.payload ?? null,
    },
    input.now,
  );

  return run ? { status: "accepted", runId: run.id } : { status: "ignored" };
}
