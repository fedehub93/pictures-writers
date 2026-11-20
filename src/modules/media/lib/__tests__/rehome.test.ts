import { describe, expect, it } from "vitest";

import { REHOME_HEADROOM_RATIO, planRehome } from "../rehome";

const GB = 1024 * 1024 * 1024;

describe("planRehome", () => {
  it("is ok when nothing needs to move", () => {
    const plan = planRehome({
      target: "local",
      files: 0,
      bytes: 0,
      availableBytes: 0,
    });

    expect(plan).toMatchObject({
      files: 0,
      bytes: 0,
      unknownFiles: 0,
      requiredBytes: 0,
      level: "ok",
      blockedReason: null,
    });
  });

  it("reserves headroom over the bytes it copies", () => {
    const plan = planRehome({
      target: "local",
      files: 4,
      bytes: 1000,
      availableBytes: GB,
    });

    expect(plan.requiredBytes).toBe(
      Math.ceil(1000 * (1 + REHOME_HEADROOM_RATIO)),
    );
    expect(plan.level).toBe("ok");
  });

  it("warns when a file records no size, because the estimate cannot see it", () => {
    const plan = planRehome({
      target: "local",
      files: 2,
      bytes: 1000,
      unknownFiles: 1,
      availableBytes: GB,
    });

    expect(plan.unknownFiles).toBe(1);
    expect(plan.level).toBe("warning");
    expect(plan.blockedReason).toBeNull();
  });

  it("warns when the copies fit but the headroom does not, and needs confirmation", () => {
    const plan = planRehome({
      target: "local",
      files: 4,
      bytes: 1000,
      availableBytes: 1050,
    });

    expect(plan.requiredBytes).toBe(1100);
    expect(plan.level).toBe("warning");
    expect(plan.blockedReason).toBeNull();
  });

  it("refuses when the volume cannot hold even the copies", () => {
    const plan = planRehome({
      target: "local",
      files: 4,
      bytes: 1000,
      availableBytes: 900,
    });

    expect(plan.level).toBe("refused");
    expect(plan.blockedReason).toBe("disk");
  });

  it("never warns for a provider target, which has no local volume", () => {
    const plan = planRehome({
      target: "uploadthing",
      files: 4,
      bytes: 1000,
      availableBytes: null,
    });

    expect(plan.level).toBe("ok");
    expect(plan.availableBytes).toBeNull();
  });

  it("refuses a target this instance cannot reach, whatever the disk says", () => {
    const plan = planRehome({
      target: "uploadthing",
      files: 1,
      bytes: 10,
      availableBytes: GB,
      targetConfigured: false,
    });

    expect(plan.level).toBe("refused");
    expect(plan.blockedReason).toBe("target-unconfigured");
  });

  it("treats a missing or nonsense byte count as nothing to copy", () => {
    const plan = planRehome({
      target: "local",
      files: Number.NaN,
      bytes: Number.POSITIVE_INFINITY,
      availableBytes: 0,
    });

    expect(plan.files).toBe(0);
    expect(plan.bytes).toBe(0);
    expect(plan.level).toBe("ok");
  });
});
