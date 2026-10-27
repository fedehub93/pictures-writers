// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { afterEach, describe, expect, it } from "vitest";

import { iubendaConfigSchema } from "@/modules/integrations/lib/providers/iubenda-config";

import { PublicHeadScripts } from "../public-head-scripts";

const config = iubendaConfigSchema.parse({
  siteId: "3303495",
  cookiePolicyId: "123456",
  lang: "it",
  autoblocking: true,
  consentMode: true,
});

const scriptIds = () =>
  Array.from(document.querySelectorAll("script[id]")).map(
    (script) => script.id,
  );

describe("PublicHeadScripts", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders CMP configuration, loader, async runtime, then GTM in document order", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<PublicHeadScripts iubendaConfig={config} gtmId="GTM-TEST" />);
    });

    const ids = scriptIds();
    const cmpIds = [
      "iubenda-configuration",
      "iubenda-loader",
      "iubenda-runtime",
    ];
    const runtimeIndex = ids.indexOf("iubenda-runtime");

    expect(ids.slice(0, cmpIds.length)).toEqual(cmpIds);
    expect(ids.indexOf("_next-gtm-init")).toBeGreaterThan(runtimeIndex);
    expect(ids.indexOf("_next-gtm")).toBeGreaterThan(runtimeIndex);
    expect(document.getElementById("iubenda-runtime")?.hasAttribute("async")).toBe(
      true,
    );
    expect(
      document.getElementById("_next-gtm")?.getAttribute("data-nscript"),
    ).toBe("afterInteractive");

    await act(async () => {
      root.unmount();
    });
  });

  it("emits no CMP markup when the integration is unavailable", () => {
    const html = renderToStaticMarkup(
      <PublicHeadScripts iubendaConfig={null} gtmId={undefined} />,
    );

    expect(html).toBe("");
  });
});
