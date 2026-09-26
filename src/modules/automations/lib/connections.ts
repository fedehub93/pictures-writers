/**
 * Connection identity helpers.
 *
 * A Connection is unique by `(fromNodeId, toNodeId, fromOutput, toInput)` —
 * the DB enforces it, and identical duplicates would double a token arrival
 * (one Step per arriving token). The editor can transiently produce duplicates
 * (e.g. an edge whose handle no longer matches a node handle), so the write
 * paths dedupe before persisting to fail safe instead of surfacing a raw
 * constraint error.
 */
export type ConnectionIdentity = {
  fromNodeId: string;
  toNodeId: string;
  fromOutput: string;
  toInput: string;
};

export function connectionIdentityKey(connection: ConnectionIdentity): string {
  return `${connection.fromNodeId}|${connection.toNodeId}|${connection.fromOutput}|${connection.toInput}`;
}

export function dedupeConnections<T extends ConnectionIdentity>(
  connections: T[],
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const connection of connections) {
    const key = connectionIdentityKey(connection);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(connection);
  }

  return unique;
}
