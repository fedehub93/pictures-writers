import "server-only";

import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationStatus,
  Prisma,
  type AutomationRun,
} from "@/generated/prisma";

import {
  cloneJson,
  findStartNodes,
  parseAutomationGraph,
  toJsonValue,
} from "./graph";

export type EnqueueRunInput = {
  automationId: string;
  triggerType: string;
  payload?: unknown;
  idempotencyKey?: string | null;
};

type AutomationReference = { id: string };

function asAutomationId(
  input: EnqueueRunInput | string | AutomationReference,
): string {
  if (typeof input === "string") {
    return input;
  }

  return "automationId" in input ? input.automationId : input.id;
}

function asJsonInput(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === undefined || value === null) {
    return Prisma.DbNull;
  }

  return toJsonValue(value) as Prisma.InputJsonValue;
}

export async function enqueueRun(
  input: EnqueueRunInput,
  now?: Date,
): Promise<AutomationRun | null>;
export async function enqueueRun(
  automationId: string,
  triggerType: string,
  payload?: unknown,
  idempotencyKey?: string | null,
  now?: Date,
): Promise<AutomationRun | null>;
export async function enqueueRun(
  automation: string | AutomationReference,
  triggerType: string,
  payload?: unknown,
  idempotencyKey?: string | null,
  now?: Date,
): Promise<AutomationRun | null>;
export async function enqueueRun(
  input: EnqueueRunInput | string | AutomationReference,
  triggerTypeOrNow?: string | Date,
  payload?: unknown,
  idempotencyKey?: string | null,
  explicitNow?: Date,
): Promise<AutomationRun | null> {
  const automationId = asAutomationId(input);
  const inputObject = typeof input === "string" ? undefined : input;
  const triggerType =
    typeof triggerTypeOrNow === "string"
      ? triggerTypeOrNow
      : inputObject && "triggerType" in inputObject
        ? inputObject.triggerType
        : "manual";
  const now =
    explicitNow ??
    (triggerTypeOrNow instanceof Date ? triggerTypeOrNow : new Date());
  const runPayload =
    inputObject && "payload" in inputObject ? inputObject.payload : payload;
  const runIdempotencyKey =
    inputObject && "idempotencyKey" in inputObject
      ? inputObject.idempotencyKey
      : idempotencyKey;

  if (!automationId || !triggerType) {
    return null;
  }

  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "Automation"
      WHERE "id" = ${automationId}
      FOR UPDATE
    `;

    if (locked.length === 0) {
      return null;
    }

    const automation = await tx.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation) {
      return null;
    }

    if (automation.status !== AutomationStatus.PUBLISHED) {
      return null;
    }

    const snapshotValue: unknown = automation.publishedSnapshot;

    if (snapshotValue == null) {
      return null;
    }

    const graph = parseAutomationGraph(snapshotValue);

    if (runIdempotencyKey != null) {
      const existing = await tx.automationRun.findFirst({
        where: {
          automationId,
          idempotencyKey: runIdempotencyKey,
          status: AutomationRunStatus.RUNNING,
        },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        return existing;
      }
    }

    const run = await tx.automationRun.create({
      data: {
        automationId,
        triggerType,
        graph: cloneJson(toJsonValue(snapshotValue)) as Prisma.InputJsonValue,
        payload: asJsonInput(runPayload),
        idempotencyKey: runIdempotencyKey,
        startedAt: now,
      },
    });

    const startNodes = findStartNodes(graph, triggerType);
    if (startNodes.length === 0) {
      return tx.automationRun.update({
        where: { id: run.id },
        data: {
          status: AutomationRunStatus.COMPLETED,
          endedAt: now,
        },
      });
    }

    await tx.automationRunStep.createMany({
      data: startNodes.map((node, index) => ({
        runId: run.id,
        nodeId: node.id,
        seq: index + 1,
        input: asJsonInput(runPayload),
      })),
    });

    return run;
  });
}
