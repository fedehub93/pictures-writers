import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DecorationView } from "@/puck/fields/decoration/ui/view/decoration-view";
import { ImageView } from "@/puck/fields/image/ui/view/image-view";
import { LayoutView } from "@/puck/fields/layout/ui/view/layout";
import { SizeView } from "@/puck/fields/size/ui/view/size-view";
import { TypographyView } from "@/puck/fields/typography/ui/view/typography-view";

/**
 * The panel's field labels are one hand's copy: sentence case, with initialisms
 * kept. These tests drive the shared field views through their props and read
 * the labels and group headings they emit, so a future label cannot quietly
 * bring back Title Case.
 */

const noop = () => undefined;

/** The props every shared field view accepts when nothing is authored. */
const emptyFieldProps = {
  currentValues: {},
  renderValues: {},
  resetProp: noop,
  onUpdate: noop,
};

/**
 * A label is sentence case when only its first word starts with a capital.
 * Initialisms ("URL", "SEO") and axis names ("(X)", "(Y)") are kept as written.
 */
function isSentenceCase(label: string) {
  return label.split(" ").every((word, index) => {
    const bare = word.replace(/^[^A-Za-z0-9]+/, "");
    return index === 0 || !/^[A-Z][a-z]/.test(bare);
  });
}

/** The labels and the group headings a field view renders. */
function copyTexts(html: string) {
  const texts = [
    ...html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g),
    ...html.matchAll(/<span class="text-sm font-medium">([\s\S]*?)<\/span>/g),
  ];

  return texts
    .map(([, text]) => text.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
}

function copyOf(...views: ReactElement[]) {
  return views.flatMap((view) => copyTexts(renderToStaticMarkup(view)));
}

describe("the properties panel's copy", () => {
  it("writes the shared field copy in sentence case", () => {
    const copy = copyOf(
      <DecorationView {...emptyFieldProps} />,
      <TypographyView {...emptyFieldProps} />,
      <SizeView {...emptyFieldProps} />,
      <ImageView {...emptyFieldProps} />,
      <LayoutView
        {...emptyFieldProps}
        renderValues={{ display: "flex" }}
        onUpdateDisplay={noop}
      />,
      <LayoutView
        {...emptyFieldProps}
        renderValues={{ display: "grid" }}
        onUpdateDisplay={noop}
      />,
    );

    expect(copy.length).toBeGreaterThan(0);
    expect(copy.filter((text) => !isSentenceCase(text))).toEqual([]);
  });

  it("keeps the initialisms as they are written", () => {
    const copy = copyOf(<ImageView {...emptyFieldProps} />);

    expect(copy).toEqual(expect.arrayContaining(["Image URL", "Loading (SEO)"]));
  });
});
