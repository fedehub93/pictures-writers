import "server-only";

import type { Node, Edge } from "@xyflow/react";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import { AutomationStatus } from "@/generated/prisma";

import {
  AUTOMATION_RUN_STATUSES,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  INITIAL_NODE_TYPE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";
import { validateAutomationGraph } from "../lib/validate";
import { enqueueRun } from "../lib/automation-ingestion";
import { hashWebhookSecret } from "../lib/webhook-secret";
import { parseRunDateRange, resolveRunNodes } from "../lib/run-ledger";
import {
  automationCreateSchema,
  automationPublishSchema,
  automationUpdateSchema,
} from "../schemas";
/** Map a client node (React Flow) to the Node row columns. */
const toNodeRow = (
  node: {
    id: string;
    type?: string | null;
    position: { x: number; y: number };
    data?: Record<string, unknown>;
    credentialId?: string | null;
  },
  automationId: string,
) => ({
  id: node.id,
  automationId,
  name: node.type || "unknown",
  type: node.type as string,
  position: node.position,
  data: node.data || {},
  credentialId: node.credentialId ?? null,
});

/** Map a client edge (React Flow) to the Connection row columns. */
const toConnectionRow = (
  edge: {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
  automationId: string,
) => ({
  automationId,
  fromNodeId: edge.source,
  toNodeId: edge.target,
  fromOutput: edge.sourceHandle || "main",
  toInput: edge.targetHandle || "main",
});

export const automationsRouter = createTRPCRouter({
  execute: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(z.object({ id: z.string(), payload: z.unknown().optional() }))
    .mutation(async ({ input }) => {
      const automation = await db.automation.findUniqueOrThrow({
        where: {
          id: input.id,
        },
      });

      const run = await enqueueRun({
        automationId: input.id,
        triggerType: "manual",
        payload:
          input.payload === undefined
            ? {
                source: "manual",
                triggeredAt: new Date().toISOString(),
              }
            : input.payload,
      });

      if (!run) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Automation has no runnable graph. Publish it before running.",
        });
      }

      return { id: automation.id, name: automation.name, runId: run.id };
    }),
  setWebhookSecret: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(
      z.object({
        id: z.string(),
        secret: z.string().min(1).max(256),
      }),
    )
    .mutation(async ({ input }) => {
      const automation = await db.automation.findUnique({
        where: { id: input.id },
      });

      if (!automation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Automation not found",
        });
      }

      await db.automation.update({
        where: { id: input.id },
        data: { webhookSecretHash: hashWebhookSecret(input.secret) },
      });

      return { id: input.id, hasWebhookSecret: true };
    }),
  clearWebhookSecret: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const automation = await db.automation.findUnique({
        where: { id: input.id },
      });

      if (!automation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Automation not found",
        });
      }

      await db.automation.update({
        where: { id: input.id },
        data: { webhookSecretHash: null },
      });

      return { id: input.id, hasWebhookSecret: false };
    }),
  getMany: permissionProcedure(PERMISSIONS.AUTOMATIONS_READ)
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        status: z
          .enum([AutomationStatus.DRAFT, AutomationStatus.PUBLISHED])
          .nullish(),
      }),
    )
    .query(async ({ input }) => {
      const where = {
        name: input.search
          ? { contains: input.search, mode: "insensitive" as const }
          : undefined,
        status: input.status ?? undefined,
      };

      const automations = await db.automation.findMany({
        where,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });

      const total = await db.automation.count({ where });

      return {
        items: automations,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),
  create: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(automationCreateSchema)
    .mutation(async ({ input }) => {
      return db.automation.create({
        data: {
          name: input.name,
          nodes: {
            create: {
              type: INITIAL_NODE_TYPE,
              position: { x: 0, y: 0 },
              name: INITIAL_NODE_TYPE,
            },
          },
        },
      });
    }),
  update: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(automationUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, nodes, edges } = input;

      const automation = await db.automation.findUnique({
        where: { id },
      });

      if (!automation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Automation not found",
        });
      }

      // Transaction to ensure consistency
      return db.$transaction(async (tx) => {
        // Delete existing nodes and connections (cascade deletes connections)
        await tx.node.deleteMany({
          where: { automationId: id },
        });

        // Create nodes
        await tx.node.createMany({
          data: nodes.map((node) => toNodeRow(node, id)),
        });

        // Create connections
        await tx.connection.createMany({
          data: edges.map((edge) => toConnectionRow(edge, id)),
        });

        // update automation's updatedAt timestamp
        await tx.automation.update({
          where: { id },
          data: {
            updatedAt: new Date(),
          },
        });

        return automation;
      });
    }),
  publish: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(automationPublishSchema)
    .mutation(async ({ input }) => {
      const { id, nodes, edges } = input;

      const automation = await db.automation.findUnique({
        where: { id },
      });

      if (!automation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Automation not found",
        });
      }

      const validation = validateAutomationGraph(nodes, edges);
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.reason,
        });
      }

      // Freeze the graph into the published snapshot (ADR-0004): Runs execute
      // this snapshot, never the live draft. Editing the draft afterwards does
      // not touch it until the next publish.
      const publishedSnapshot = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          name: node.type,
          data: node.data || {},
        })),
        connections: edges.map((edge) => ({
          fromNodeId: edge.source,
          toNodeId: edge.target,
          fromOutput: edge.sourceHandle || "main",
          toInput: edge.targetHandle || "main",
        })),
      };

      return db.$transaction(async (tx) => {
        // Delete existing nodes and connections (cascade deletes connections)
        await tx.node.deleteMany({
          where: { automationId: id },
        });

        await tx.node.createMany({
          data: nodes.map((node) => toNodeRow(node, id)),
        });

        await tx.connection.createMany({
          data: edges.map((edge) => toConnectionRow(edge, id)),
        });

        return tx.automation.update({
          where: { id },
          data: {
            status: AutomationStatus.PUBLISHED,
            publishedSnapshot,
          },
        });
      });
    }),
  updateName: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ input }) => {
      return db.automation.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
        },
      });
    }),
  remove: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const automation = await db.automation.findUnique({
        where: { id: input.id },
      });

      if (!automation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Automation not found",
        });
      }

      return db.automation.delete({
        where: { id: input.id },
      });
    }),
  getOne: permissionProcedure(PERMISSIONS.AUTOMATIONS_READ)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const automation = await db.automation.findUnique({
        where: { id: input.id },
        include: {
          nodes: {
            orderBy: { createdAt: "asc" },
          },
          connections: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!automation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Automation not found",
        });
      }

      // Transforming server nodes to react-flow compatible nodes
      const nodes: Node[] = automation.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number },
        data: {
          ...(node.data as Record<string, unknown> | null),
          credentialId: node.credentialId ?? undefined,
        },
      }));

      // Transform server connections to react-flow compatibles edges
      const edges: Edge[] = automation.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      // The secret hash must never reach the client; expose only its presence.
      const { webhookSecretHash, ...rest } = automation;

      return {
        ...rest,
        hasWebhookSecret: webhookSecretHash != null,
        nodes,
        connections: edges,
      };
    }),
  getRuns: permissionProcedure(PERMISSIONS.AUTOMATIONS_READ)
    .input(
      z.object({
        automationId: z.string(),
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        status: z.enum(AUTOMATION_RUN_STATUSES).nullish(),
        from: z.string().nullish(),
        to: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const { gte, lte } = parseRunDateRange({
        from: input.from,
        to: input.to,
      });

      const where = {
        automationId: input.automationId,
        status: input.status ?? undefined,
        startedAt: gte || lte ? { gte, lte } : undefined,
      };

      const [items, total] = await Promise.all([
        db.automationRun.findMany({
          where,
          select: {
            id: true,
            status: true,
            triggerType: true,
            startedAt: true,
            endedAt: true,
            error: true,
          },
          orderBy: { startedAt: "desc" },
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
        }),
        db.automationRun.count({ where }),
      ]);

      return {
        items,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),
  getRun: permissionProcedure(PERMISSIONS.AUTOMATIONS_READ)
    .input(z.object({ id: z.string(), automationId: z.string() }))
    .query(async ({ input }) => {
      const run = await db.automationRun.findUnique({
        where: { id: input.id },
        include: {
          automation: { select: { id: true, name: true } },
          steps: { orderBy: { seq: "asc" } },
        },
      });

      if (!run || run.automationId !== input.automationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Run not found",
        });
      }

      const { graph, steps, idempotencyKey: _idempotencyKey, ...rest } = run;
      const nodes = resolveRunNodes(graph);

      return {
        ...rest,
        steps: steps.map((step) => ({
          ...step,
          nodeType: nodes[step.nodeId]?.type ?? null,
          nodeName: nodes[step.nodeId]?.name ?? null,
        })),
      };
    }),
});