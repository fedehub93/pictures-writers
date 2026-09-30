import * as z from "zod";

export const automationCreateSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
});

export type AutomationCreateValues = z.infer<typeof automationCreateSchema>;

export const automationUpdateSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string().nullish(),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.record(z.string(), z.any()).optional(),
      credentialId: z.string().nullish(),
    }),
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().nullish(),
      targetHandle: z.string().nullish(),
    }),
  ),
});

export type AutomationUpdateValues = z.infer<typeof automationUpdateSchema>;

const graphNodeSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.any()).optional(),
  credentialId: z.string().nullish(),
});

const graphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullish(),
  targetHandle: z.string().nullish(),
});

export const automationPublishSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});

export type AutomationPublishValues = z.infer<typeof automationPublishSchema>;
