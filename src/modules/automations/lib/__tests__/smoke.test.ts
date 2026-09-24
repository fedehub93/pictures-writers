import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { AutomationStatus } from "@/generated/prisma";
import { cleanupAutomationTables } from "@/modules/automations";

describe("automations module entry point", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  afterEach(async () => {
    await cleanupAutomationTables();
  });

  it("exports the module entry point and round-trips an Automation", async () => {
    const automation = await db.automation.create({
      data: { name: "Smoke flow" },
    });

    expect(automation.id).toBeTruthy();
    expect(automation.name).toBe("Smoke flow");
    expect(automation.status).toBe(AutomationStatus.DRAFT);
    expect(automation.publishedSnapshot).toBeNull();

    const found = await db.automation.findUnique({
      where: { id: automation.id },
    });
    expect(found?.name).toBe("Smoke flow");
  });
});