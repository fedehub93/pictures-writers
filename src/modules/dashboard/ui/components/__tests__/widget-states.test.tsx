import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { WidgetEmpty, WidgetError, WidgetLoading } from "../widget-states";

describe("dashboard widget states", () => {
  it("announces that it is loading", () => {
    const html = renderToStaticMarkup(<WidgetLoading />);

    expect(html).toContain('role="status"');
    expect(html).toContain("Loading");
  });

  it("renders the shared error message", () => {
    const html = renderToStaticMarkup(<WidgetError />);

    expect(html).toContain("Unable to load the widget.");
  });

  it("renders the empty message it is given", () => {
    const html = renderToStaticMarkup(
      <WidgetEmpty message="No drafts to publish." />,
    );

    expect(html).toContain("No drafts to publish.");
  });
});
