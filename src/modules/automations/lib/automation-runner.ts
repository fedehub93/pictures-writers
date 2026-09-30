import "server-only";

import { randomUUID } from "node:crypto";

import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationRunStepStatus,
  Prisma,
  type AutomationRunStep,
} from "@/generated/prisma";

import {
  AUTOMATION_BATCH_SIZE,
  AUTOMATION_LEASE_MS,
  AUTOMATION_MAX_ATTEMPTS,
  AUTOMATION_MAX_EXECUTIONS,
  AUTOMATION_RETRY_DELAY_MS,
} from "../constants";
import {
  canonicalNodeType,
  capJsonValue,
  findNode,
  getOutgoingConnections,
  isExecutableNode,
  parseAutomationGraph,
  toJsonValue,
  type JsonValue,
} from "./graph";
import {
  defaultNodeRegistry,
  getNodeHandler,
  isTransientNodeError,
  mergeNodeRegistries,
  type AutomationNodeHandlerResult,
  type AutomationNodeRegistry,
} from "./node-registry";
import {
  unconfiguredEffects,
  type AutomationEffects,
} from "./effects";
import { DEFAULT_TIME_ZONE } from "./time-zone";

export type AutomationStepResultStatus =
  | "succeeded"
  | "failed"
  | "retry_wait"
  | "waiting"
  | "skipped";

export interface RunDueAutomationsInput {
  now?: Date;
  batchSize?: number;
  leaseMs?: number;
  registry?: AutomationNodeRegistry;
  handlers?: AutomationNodeRegistry;
  effects?: AutomationEffects;
  /** Site IANA time zone; defaults to UTC. */
  timeZone?: string;
}

export interface RunDueAutomationsResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  details: Array<{
    runId: string;
    stepId: string;
    nodeId: string;
    status: AutomationStepResultStatus;
    error?: string;
  }>;
}

type StepExecution = {
  status: AutomationStepResultStatus;
  error?: string;
};

function jsonInput(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === undefined || value === null) {
    return Prisma.DbNull;
  }

  return capJsonValue(toJsonValue(value)) as Prisma.InputJsonValue;
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown node error";
  return message.slice(0, 2000);
}

function validDate(value: unknown): Date | null {
  const date =
    value instanceof Date
      ? value
      : typeof value === "number" || typeof value === "string"
        ? new Date(value)
        : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
}

async function lockRun(
  tx: Prisma.TransactionClient,
  runId: string,
): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "AutomationRun"
    WHERE "id" = ${runId}
    FOR UPDATE
  `;

  return rows.length > 0;
}

async function terminalizeRun(
  tx: Prisma.TransactionClient,
  runId: string,
  now: Date,
): Promise<void> {
  const run = await tx.automationRun.findUnique({
    where: { id: runId },
    select: { status: true },
  });

  if (!run || run.status !== AutomationRunStatus.RUNNING) {
    return;
  }

  const steps = await tx.automationRunStep.findMany({
    where: { runId },
    select: { status: true },
  });
  const hasFailure = steps.some(
    (step) => step.status === AutomationRunStepStatus.FAILED,
  );
  const hasActiveStep = steps.some(
    (step) =>
      step.status === AutomationRunStepStatus.PENDING ||
      step.status === AutomationRunStepStatus.RUNNING,
  );

  if (hasFailure) {
    await tx.automationRun.update({
      where: { id: runId },
      data: {
        status: AutomationRunStatus.FAILED,
        endedAt: now,
        error: "A step failed",
      },
    });
    return;
  }

  if (!hasActiveStep) {
    await tx.automationRun.update({
      where: { id: runId },
      data: {
        status: AutomationRunStatus.COMPLETED,
        endedAt: now,
        error: null,
      },
    });
  }
}

export async function findDueAutomationSteps(
  options: { now?: Date; batchSize?: number } = {},
): Promise<AutomationRunStep[]> {
  const now = options.now ?? new Date();
  const batchSize = Math.max(1, Math.floor(options.batchSize ?? AUTOMATION_BATCH_SIZE));

  return db.$queryRaw<AutomationRunStep[]>`
    SELECT step.*
    FROM "AutomationRunStep" step
    INNER JOIN "AutomationRun" run ON run."id" = step."runId"
    WHERE run."status" = 'RUNNING'::"AutomationRunStatus"
      AND (
        (
          step."status" = 'PENDING'::"AutomationRunStepStatus"
          AND (step."resumeAt" IS NULL OR step."resumeAt" <= ${now})
        )
        OR (
          step."status" = 'RUNNING'::"AutomationRunStepStatus"
          AND step."leaseExpiresAt" IS NOT NULL
          AND step."leaseExpiresAt" <= ${now}
        )
      )
    ORDER BY COALESCE(step."resumeAt", step."createdAt") ASC
    LIMIT ${batchSize}
  `;
}

export async function claimDueAutomationStep(
  options: {
    leaseId?: string;
    now?: Date;
    leaseMs?: number;
  } = {},
): Promise<AutomationRunStep | null> {
  const leaseId = options.leaseId ?? randomUUID();
  const now = options.now ?? new Date();
  const leaseMs = options.leaseMs ?? AUTOMATION_LEASE_MS;
  const leaseExpiresAt = new Date(now.getTime() + leaseMs);

  const result = await db.$queryRaw<AutomationRunStep[]>`
    UPDATE "AutomationRunStep" AS step
    SET "status" = 'RUNNING'::"AutomationRunStepStatus",
        "attempts" = step."attempts" + 1,
        "leaseId" = ${leaseId},
        "leaseExpiresAt" = ${leaseExpiresAt},
        "startedAt" = ${now},
        "updatedAt" = ${now}
    WHERE step."id" = (
      SELECT candidate."id"
      FROM "AutomationRunStep" candidate
      INNER JOIN "AutomationRun" run ON run."id" = candidate."runId"
      WHERE run."status" = 'RUNNING'::"AutomationRunStatus"
        AND (
          (
            candidate."status" = 'PENDING'::"AutomationRunStepStatus"
            AND (candidate."resumeAt" IS NULL OR candidate."resumeAt" <= ${now})
          )
          OR (
            candidate."status" = 'RUNNING'::"AutomationRunStepStatus"
            AND candidate."leaseExpiresAt" IS NOT NULL
            AND candidate."leaseExpiresAt" <= ${now}
          )
        )
      ORDER BY COALESCE(candidate."resumeAt", candidate."createdAt") ASC
      FOR UPDATE OF candidate SKIP LOCKED
      LIMIT 1
    )
    RETURNING step.*
  `;

  return result[0] ?? null;
}

async function releaseStep(
  step: AutomationRunStep,
  status: AutomationRunStepStatus,
  now: Date,
): Promise<void> {
  await db.automationRunStep.updateMany({
    where: {
      id: step.id,
      status: AutomationRunStepStatus.RUNNING,
      leaseId: step.leaseId,
    },
    data: {
      status,
      leaseId: null,
      leaseExpiresAt: null,
      updatedAt: now,
    },
  });
}

async function failStep(
  step: AutomationRunStep,
  message: string,
  now: Date,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    if (!(await lockRun(tx, step.runId))) {
      return false;
    }

    const updated = await tx.automationRunStep.updateMany({
      where: {
        id: step.id,
        status: AutomationRunStepStatus.RUNNING,
        leaseId: step.leaseId,
      },
      data: {
        status: AutomationRunStepStatus.FAILED,
        attempts: step.attempts,
        error: message,
        resumeAt: null,
        leaseId: null,
        leaseExpiresAt: null,
        endedAt: now,
        updatedAt: now,
      },
    });

    if (updated.count === 0) {
      return false;
    }

    await tx.automationRunStep.updateMany({
      where: {
        runId: step.runId,
        id: { not: step.id },
        status: {
          in: [
            AutomationRunStepStatus.PENDING,
            AutomationRunStepStatus.RUNNING,
          ],
        },
      },
      data: {
        status: AutomationRunStepStatus.SKIPPED,
        resumeAt: null,
        leaseId: null,
        leaseExpiresAt: null,
        endedAt: now,
        updatedAt: now,
      },
    });

    await tx.automationRun.update({
      where: { id: step.runId },
      data: {
        status: AutomationRunStatus.FAILED,
        error: message,
        endedAt: now,
      },
    });

    return true;
  });
}

async function retryStep(
  step: AutomationRunStep,
  message: string,
  now: Date,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    if (!(await lockRun(tx, step.runId))) {
      return false;
    }

    const updated = await tx.automationRunStep.updateMany({
      where: {
        id: step.id,
        status: AutomationRunStepStatus.RUNNING,
        leaseId: step.leaseId,
      },
      data: {
        status: AutomationRunStepStatus.PENDING,
        attempts: step.attempts,
        error: message,
        resumeAt: new Date(now.getTime() + AUTOMATION_RETRY_DELAY_MS),
        leaseId: null,
        leaseExpiresAt: null,
        endedAt: null,
        updatedAt: now,
      },
    });

    return updated.count > 0;
  });
}

async function waitStep(
  step: AutomationRunStep,
  resumeAt: Date,
  output: JsonValue,
  now: Date,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    if (!(await lockRun(tx, step.runId))) {
      return false;
    }

    const updated = await tx.automationRunStep.updateMany({
      where: {
        id: step.id,
        status: AutomationRunStepStatus.RUNNING,
        leaseId: step.leaseId,
      },
      data: {
        status: AutomationRunStepStatus.PENDING,
        attempts: step.attempts,
        output: jsonInput(output),
        resumeAt,
        error: null,
        leaseId: null,
        leaseExpiresAt: null,
        endedAt: null,
        updatedAt: now,
      },
    });

    return updated.count > 0;
  });
}

async function completeStep(
  step: AutomationRunStep,
  output: JsonValue,
  outputPort: string,
  graph: ReturnType<typeof parseAutomationGraph>,
  now: Date,
  attempts = step.attempts,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    if (!(await lockRun(tx, step.runId))) {
      return false;
    }

    const updated = await tx.automationRunStep.updateMany({
      where: {
        id: step.id,
        status: AutomationRunStepStatus.RUNNING,
        leaseId: step.leaseId,
      },
      data: {
        status: AutomationRunStepStatus.COMPLETED,
        attempts,
        output: jsonInput(output),
        error: null,
        resumeAt: null,
        leaseId: null,
        leaseExpiresAt: null,
        endedAt: now,
        updatedAt: now,
      },
    });

    if (updated.count === 0) {
      return false;
    }

    const outgoing = getOutgoingConnections(graph, step.nodeId, outputPort).filter(
      (connection) => {
        const target = findNode(graph, connection.toNodeId);
        return target ? isExecutableNode(target) : false;
      },
    );

    if (outgoing.length > 0) {
      const max = await tx.automationRunStep.aggregate({
        where: { runId: step.runId },
        _max: { seq: true },
      });
      const firstSeq = (max._max.seq ?? 0) + 1;

      await tx.automationRunStep.createMany({
        data: outgoing.map((connection, index) => ({
          runId: step.runId,
          nodeId: connection.toNodeId,
          seq: firstSeq + index,
          input: jsonInput(output),
        })),
      });
    }

    await terminalizeRun(tx, step.runId, now);
    return true;
  });
}

async function cancelRunForExecutionLimit(
  step: AutomationRunStep,
  now: Date,
): Promise<boolean> {
  return db.$transaction(async (tx) => {
    if (!(await lockRun(tx, step.runId))) {
      return false;
    }

    await tx.automationRunStep.updateMany({
      where: {
        runId: step.runId,
        status: {
          in: [AutomationRunStepStatus.PENDING, AutomationRunStepStatus.RUNNING],
        },
      },
      data: {
        status: AutomationRunStepStatus.SKIPPED,
        resumeAt: null,
        leaseId: null,
        leaseExpiresAt: null,
        endedAt: now,
        updatedAt: now,
      },
    });

    const updated = await tx.automationRun.updateMany({
      where: { id: step.runId, status: AutomationRunStatus.RUNNING },
      data: {
        status: AutomationRunStatus.CANCELED,
        error: `Automation exceeded the ${AUTOMATION_MAX_EXECUTIONS} execution limit`,
        endedAt: now,
      },
    });

    return updated.count > 0;
  });
}

async function processStep(
  step: AutomationRunStep,
  now: Date,
  registry: AutomationNodeRegistry,
  effects: AutomationEffects,
  timeZone: string,
): Promise<StepExecution> {
  const run = await db.automationRun.findUnique({ where: { id: step.runId } });

  if (!run || run.status !== AutomationRunStatus.RUNNING) {
    await releaseStep(step, AutomationRunStepStatus.SKIPPED, now);
    return { status: "skipped" };
  }

  let graph: ReturnType<typeof parseAutomationGraph>;
  let node: ReturnType<typeof findNode>;

  try {
    graph = parseAutomationGraph(run.graph);
    node = findNode(graph, step.nodeId);
  } catch (error) {
    const message = errorMessage(error);
    await failStep(step, message, now);
    return { status: "failed", error: message };
  }

  if (!node) {
    const message = `Run graph does not contain Step node ${step.nodeId}`;
    await failStep(step, message, now);
    return { status: "failed", error: message };
  }

  const executionCount = await db.automationRunStep.aggregate({
    where: { runId: step.runId },
    _sum: { attempts: true },
  });
  if ((executionCount._sum.attempts ?? 0) > AUTOMATION_MAX_EXECUTIONS) {
    await cancelRunForExecutionLimit(step, now);
    return { status: "skipped" };
  }

  const input = step.input ?? run.payload ?? null;
  const handler = getNodeHandler(node.type, registry);

  if (!handler) {
    const message = `No handler registered for node type ${node.type}`;
    await failStep(step, message, now);
    return { status: "failed", error: message };
  }

  const resumedWait =
    canonicalNodeType(node.type) === "wait" && step.resumeAt !== null;

  if (resumedWait) {
    const output = step.output ?? input;
    const completed = await completeStep(
      step,
      output,
      "main",
      graph,
      now,
      Math.max(1, step.attempts - 1),
    );
    return completed
      ? { status: "succeeded" }
      : { status: "skipped" };
  }

  try {
    const rawResult = await handler({
      node,
      input,
      payload: run.payload ?? null,
      run: { id: run.id, triggerType: run.triggerType },
      step: { id: step.id, attempts: step.attempts },
      now,
      effects,
      timeZone,
    });
    const result: AutomationNodeHandlerResult =
      rawResult && typeof rawResult === "object"
        ? rawResult
        : { output: (rawResult as JsonValue | undefined) ?? null };
    const output = result.output === undefined ? input : result.output;

    if (result.resumeAt !== undefined) {
      const resumeAt = validDate(result.resumeAt);
      if (!resumeAt) {
        throw new Error("Node returned an invalid resume time");
      }
      const waiting = await waitStep(step, resumeAt, output, now);
      return waiting ? { status: "waiting" } : { status: "skipped" };
    }

    const outputPort = result.outputPort || "main";
    const completed = await completeStep(step, output, outputPort, graph, now);
    return completed
      ? { status: "succeeded" }
      : { status: "skipped" };
  } catch (error) {
    const message = errorMessage(error);
    const canRetry =
      isTransientNodeError(error) && step.attempts < AUTOMATION_MAX_ATTEMPTS;

    if (canRetry) {
      const retried = await retryStep(step, message, now);
      return retried
        ? { status: "retry_wait", error: message }
        : { status: "skipped" };
    }

    await failStep(step, message, now);
    return { status: "failed", error: message };
  }
}

export async function runDueAutomations(
  input: RunDueAutomationsInput = {},
): Promise<RunDueAutomationsResult> {
  const now = input.now ?? new Date();
  const batchSize = Math.max(1, Math.floor(input.batchSize ?? AUTOMATION_BATCH_SIZE));
  const registry = mergeNodeRegistries(
    defaultNodeRegistry,
    input.registry ?? input.handlers ?? {},
  );
  const effects = input.effects ?? unconfiguredEffects;
  const timeZone = input.timeZone ?? DEFAULT_TIME_ZONE;
  const result: RunDueAutomationsResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  const due = await findDueAutomationSteps({ now, batchSize });

  for (const _step of due) {
    const step = await claimDueAutomationStep({
      now,
      leaseMs: input.leaseMs ?? AUTOMATION_LEASE_MS,
    });

    if (!step) {
      continue;
    }

    result.processed++;
    const execution = await processStep(step, now, registry, effects, timeZone);

    if (execution.status === "succeeded") {
      result.succeeded++;
    } else if (execution.status === "skipped") {
      result.skipped++;
    } else if (execution.status === "failed") {
      result.failed++;
    }

    result.details.push({
      runId: step.runId,
      stepId: step.id,
      nodeId: step.nodeId,
      status: execution.status,
      error: execution.error,
    });
  }

  return result;
}

export const runDueAutomationsWithRegistry = runDueAutomations;
