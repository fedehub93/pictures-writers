import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { WidgetEmpty, WidgetError, WidgetLoading } from "../widget-states";

describe("dashboard widget states", () => {
  it("announces that it is loading", () => {
    const html = renderToStaticMarkup(<WidgetLoading />);

    expect(html).toContain('role="status"');
    expect(html).toContain("Caricamento in corso");
  });

  it("renders the shared error message", () => {
    const html = renderToStaticMarkup(<WidgetError />);

    expect(html).toContain("Impossibile caricare il widget.");
  });

  it("renders the empty message it is given", () => {
    const html = renderToStaticMarkup(
      <WidgetEmpty message="Nessuna bozza da pubblicare." />,
    );

    expect(html).toContain("Nessuna bozza da pubblicare.");
  });
});
