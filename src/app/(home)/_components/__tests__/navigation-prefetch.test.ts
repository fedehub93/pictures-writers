import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const SRC = path.resolve(process.cwd(), "src");

const PUBLIC_LINK_ROOTS = [
  path.join(SRC, "app/(home)/_components"),
  path.join(SRC, "modules/blog/posts/ui/public"),
  path.join(SRC, "modules/shop/products/ui/public"),
  path.join(SRC, "shared/components/widget"),
  path.join(SRC, "shared/components/tiptap-renderer"),
];

function collectTsx(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectTsx(entryPath);
    }

    return entry.name.endsWith(".tsx") && !entry.name.includes(".test.")
      ? [entryPath]
      : [];
  });
}

function explicitPrefetchTags(source: string): string[] {
  const tags = source.match(/<(?:Link|NextLink)\b[^>]*>/g) ?? [];

  return tags.filter(
    (tag) =>
      /\bprefetch\b/.test(tag) && !/prefetch\s*=\s*\{\s*false\s*\}/.test(tag),
  );
}

describe("public link prefetching", () => {
  it("does not opt public links into explicit route prefetching", () => {
    const offenders = PUBLIC_LINK_ROOTS.flatMap(collectTsx).flatMap((file) =>
      explicitPrefetchTags(readFileSync(file, "utf8")).map(
        (tag) => `${path.relative(SRC, file)}: ${tag}`,
      ),
    );

    expect(
      offenders,
      "Explicit prefetch props defeat the browser-default prefetch budget",
    ).toEqual([]);
  });
});
