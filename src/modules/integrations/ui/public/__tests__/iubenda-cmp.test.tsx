import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it } from "vitest";

import { iubendaConfigSchema } from "@/modules/integrations/lib/providers/iubenda-config";

import { IubendaCmp } from "../iubenda-cmp";

const config = iubendaConfigSchema.parse({
  siteId: "3303495",
  cookiePolicyId: "123456",
  lang: "it",
  autoblocking: true,
  consentMode: true,
});

function collectElements(
  node: ReactNode,
  elements: ReactElement[] = [],
): ReactElement[] {
  if (Array.isArray(node)) {
    node.forEach((child) => collectElements(child, elements));
    return elements;
  }

  if (!isValidElement(node)) {
    return elements;
  }

  elements.push(node);
  const children = (node.props as { children?: ReactNode }).children;
  if (children) {
    collectElements(children, elements);
  }

  return elements;
}

interface ScriptProps {
  id?: string;
  src?: string;
  async?: boolean;
  dangerouslySetInnerHTML?: { __html?: string };
}

const props = (element: ReactElement) => element.props as ScriptProps;

describe("IubendaCmp", () => {
  it("renders configuration, loader and asynchronous runtime in that order", () => {
    const elements = collectElements(IubendaCmp({ config })).filter(
      (element) => props(element).id,
    );
    const ids = elements.map((element) => props(element).id);

    expect(ids).toEqual([
      "iubenda-configuration",
      "iubenda-loader",
      "iubenda-runtime",
    ]);

    const loader = elements[1]!;
    const runtime = elements[2]!;
    expect(props(loader).src).toBe(
      "https://cs.iubenda.com/autoblocking/3303495.js",
    );
    expect(props(runtime).src).toBe(
      "https://cdn.iubenda.com/cs/iubenda_cs.js",
    );
    expect(props(runtime).async).toBe(true);
    expect(props(loader).async).toBeFalsy();
  });

  it("keeps the runtime after the configuration and loader in the rendered markup", () => {
    const html = renderToStaticMarkup(<IubendaCmp config={config} />);
    const configurationIndex = html.indexOf('id="iubenda-configuration"');
    const loaderIndex = html.indexOf('id="iubenda-loader"');
    const runtimeIndex = html.indexOf('id="iubenda-runtime"');

    expect(configurationIndex).toBeGreaterThanOrEqual(0);
    expect(loaderIndex).toBeGreaterThan(configurationIndex);
    expect(runtimeIndex).toBeGreaterThan(loaderIndex);
    expect(html).toMatch(/id="iubenda-runtime"[^>]*\sasync=""/);
  });

  it("uses the sync loader when autoblocking is off", () => {
    const elements = collectElements(
      IubendaCmp({ config: { ...config, autoblocking: false } }),
    ).filter((element) => props(element).id);

    expect(props(elements[1]!).src).toBe(
      "https://cs.iubenda.com/sync/3303495.js",
    );
  });

  it("writes the CMP configuration with the Consent Mode flag", () => {
    const elements = collectElements(IubendaCmp({ config })).filter(
      (element) => props(element).id,
    );
    const html = props(elements[0]!).dangerouslySetInnerHTML?.__html;

    expect(html).toContain('_iub.csConfiguration = {"siteId":3303495');
    expect(html).toContain('"cookiePolicyId":123456');
    expect(html).toContain('"lang":"it"');
    expect(html).toContain('"googleConsentMode":true');
  });

  it("writes the Consent Mode flag as false when the admin disables it", () => {
    const html = renderToStaticMarkup(
      <IubendaCmp config={{ ...config, consentMode: false }} />,
    );

    expect(html).toContain('"googleConsentMode":false');
  });

  it("renders nothing without a resolved configuration", () => {
    expect(IubendaCmp({ config: null })).toBeNull();
  });
});
