import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "@/shared/lib/permissions";

import { METRICS, getMetric, permittedMetrics } from "../registry";

describe("metric registry", () => {
  it("exposes the contact metric with its label and permission", () => {
    expect(getMetric("contacts")).toMatchObject({
      id: "contacts",
      label: "Contacts",
      permission: PERMISSIONS.CONTACTS_READ,
    });
  });

  it("exposes exactly the registered metrics", () => {
    expect(METRICS.map((metric) => metric.id)).toEqual([
      "contacts",
      "submissions",
      "ebooks",
      "revenue",
    ]);
  });

  it("scopes each metric to its area permission", () => {
    expect(getMetric("contacts")?.permission).toBe(PERMISSIONS.CONTACTS_READ);
    expect(getMetric("submissions")?.permission).toBe(
      PERMISSIONS.SUBMISSIONS_READ,
    );
    expect(getMetric("ebooks")?.permission).toBe(PERMISSIONS.DASHBOARD_READ);
    expect(getMetric("revenue")?.permission).toBe(PERMISSIONS.ORDERS_READ);
  });

  it("keeps only the metrics the user is permitted to read", () => {
    const permitted = permittedMetrics(
      (permission) =>
        permission === PERMISSIONS.CONTACTS_READ ||
        permission === PERMISSIONS.ORDERS_READ,
    );

    expect(permitted.map((metric) => metric.id)).toEqual([
      "contacts",
      "revenue",
    ]);
  });

  it("exposes no metric when the user holds none of the required permissions", () => {
    expect(permittedMetrics(() => false)).toEqual([]);
  });

  it("returns undefined for an unknown metric id", () => {
    expect(getMetric("nope")).toBeUndefined();
  });
});
