import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { enqueueRun } from "@/modules/automations/lib/automation-ingestion";
import { cleanupAutomationTables } from "@/modules/automations/lib/cleanup";
import { passthroughEffects } from "@/modules/automations/lib/effects";
import { pumpDueAutomations } from "@/modules/automations/server/automation-runtime";
import { db } from "@/shared/lib/db";
import {
  AutomationRunStatus,
  AutomationStatus,
} from "@/generated/prisma";

import { createCustomerNodeCatalogEntry } from "../catalog";
import { CREATE_CUSTOMER_NODE_TYPE } from "../constants";
import { createCustomerNodeRegistry } from "../node";

function uniqueEmail(): string {
  return `automation-customer-${randomUUID()}@example.com`;
}

async function publishGraph(graph: unknown) {
  return db.automation.create({
    data: {
      name: "Create customer",
      status: AutomationStatus.PUBLISHED,
      publishedSnapshot: graph as never,
    },
  });
}

const customerGraph = {
  nodes: [
    { id: "trigger", type: "MANUAL_TRIGGER", data: {} },
    {
      id: "create-customer",
      type: CREATE_CUSTOMER_NODE_TYPE,
      data: {
        email: "{{ payload.email }}",
        name: "{{ payload.name }}",
        phone: "555-0100",
        notes: "from automation",
      },
    },
  ],
  connections: [{ fromNodeId: "trigger", toNodeId: "create-customer" }],
};

const emails: string[] = [];

beforeEach(async () => {
  await cleanupAutomationTables();
});

afterEach(async () => {
  if (emails.length > 0) {
    await db.customer.deleteMany({ where: { email: { in: emails } } });
  }
  emails.length = 0;
});

describe("CREATE_CUSTOMER node", () => {
  it("is offered in the palette as an action", () => {
    expect(createCustomerNodeCatalogEntry.type).toBe(
      CREATE_CUSTOMER_NODE_TYPE,
    );
    expect(createCustomerNodeCatalogEntry.category).toBe("action");
    expect(createCustomerNodeCatalogEntry.label).toBe("Create customer");
  });

  it("registers a handler under the canonical action key", () => {
    expect(Object.keys(createCustomerNodeRegistry)).toContain(
      "createCustomer",
    );
  });

  it("creates a customer from the automation input", async () => {
    const email = uniqueEmail();
    emails.push(email);
    const automation = await publishGraph(customerGraph);

    await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { email, name: "Ada Lovelace" },
    });

    await pumpDueAutomations({
      registry: createCustomerNodeRegistry,
      effects: passthroughEffects,
    });

    const customer = await db.customer.findUnique({ where: { email } });
    expect(customer).not.toBeNull();
    expect(customer?.name).toBe("Ada Lovelace");
    expect(customer?.phone).toBe("555-0100");
    expect(customer?.notes).toBe("from automation");

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.status).toBe(AutomationRunStatus.COMPLETED);
  });

  it("updates an existing customer identified by email", async () => {
    const email = uniqueEmail();
    emails.push(email);
    const existing = await db.customer.create({
      data: { email, name: "Old Name", phone: "000" },
    });
    const automation = await publishGraph(customerGraph);

    await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { email, name: "New Name" },
    });

    await pumpDueAutomations({
      registry: createCustomerNodeRegistry,
      effects: passthroughEffects,
    });

    const customer = await db.customer.findUniqueOrThrow({ where: { email } });
    expect(customer.id).toBe(existing.id);
    expect(customer.name).toBe("New Name");
    expect(customer.phone).toBe("555-0100");
    expect(await db.customer.count({ where: { email } })).toBe(1);
  });

  it("fails the step when the email cannot be resolved", async () => {
    const automation = await publishGraph(customerGraph);

    await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload: { name: "No Email" },
    });

    await pumpDueAutomations({
      registry: createCustomerNodeRegistry,
      effects: passthroughEffects,
    });

    const run = await db.automationRun.findFirstOrThrow();
    expect(run.status).toBe(AutomationRunStatus.FAILED);
  });
});
