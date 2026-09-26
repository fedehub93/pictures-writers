import { describe, expect, it } from "vitest";

import {
  connectionIdentityKey,
  dedupeConnections,
  type ConnectionIdentity,
} from "../connections";

const connection = (
  overrides: Partial<ConnectionIdentity> = {},
): ConnectionIdentity => ({
  fromNodeId: "a",
  toNodeId: "b",
  fromOutput: "main",
  toInput: "main",
  ...overrides,
});

describe("dedupeConnections", () => {
  it("keeps distinct connections", () => {
    const input = [
      connection(),
      connection({ toNodeId: "c" }),
      connection({ fromOutput: "true" }),
      connection({ toInput: "other" }),
    ];

    expect(dedupeConnections(input)).toHaveLength(4);
  });

  it("drops identical duplicates, keeping the first", () => {
    const first = connection();
    const input = [first, connection(), connection({ toNodeId: "c" })];

    const result = dedupeConnections(input);

    expect(result).toEqual([first, connection({ toNodeId: "c" })]);
  });

  it("distinguishes by output and input ports", () => {
    expect(
      dedupeConnections([
        connection({ fromOutput: "true" }),
        connection({ fromOutput: "false" }),
      ]),
    ).toHaveLength(2);
  });
});

describe("connectionIdentityKey", () => {
  it("joins the four identity fields", () => {
    expect(connectionIdentityKey(connection())).toBe("a|b|main|main");
  });
});
