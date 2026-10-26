import { describe, expect, it } from "vitest";

import {
  DEFAULT_SERVICE_FEATURE_ICON,
  SERVICE_FEATURE_ICONS,
  getServiceFeatureIcon,
} from "../service-feature-icons";
import {
  SERVICE_FEATURE_ICON_NAMES,
  type ServiceFeatureIconName,
} from "../service-feature-icon-names";
import { serviceMetadataSchema } from "../../schemas";

const feature = (Icon: string) => ({
  title: "Analisi",
  Icon,
  description: "Analizziamo la struttura narrativa.",
});

const metadata = (Icon: string) => ({
  type: "SERVICE" as const,
  serviceType: "Soggetto",
  competitorPrice: 100,
  target: "Sceneggiatori",
  attachamentUrl: "https://example.com/report.pdf",
  features: [feature(Icon)],
});

describe("service feature icons", () => {
  it("only exposes the icons products are allowed to reference", () => {
    expect(Object.keys(SERVICE_FEATURE_ICONS).sort()).toEqual(
      [...SERVICE_FEATURE_ICON_NAMES].sort(),
    );
  });

  it("resolves a whitelisted icon name to its component", () => {
    for (const name of SERVICE_FEATURE_ICON_NAMES) {
      expect(getServiceFeatureIcon(name)).toBe(SERVICE_FEATURE_ICONS[name]);
    }
  });

  it("falls back to the default icon for unknown names", () => {
    expect(getServiceFeatureIcon("TotallyUnknownIcon")).toBe(
      DEFAULT_SERVICE_FEATURE_ICON,
    );
  });

  it("does not resolve inherited prototype properties to an icon", () => {
    expect(getServiceFeatureIcon("constructor")).toBe(
      DEFAULT_SERVICE_FEATURE_ICON,
    );
  });

  it.each(SERVICE_FEATURE_ICON_NAMES)(
    "accepts the whitelisted icon %s in service metadata",
    (Icon) => {
      const result = serviceMetadataSchema.safeParse(
        metadata(Icon as ServiceFeatureIconName),
      );

      expect(result.success).toBe(true);
    },
  );

  it("rejects an icon outside the whitelist in service metadata", () => {
    const result = serviceMetadataSchema.safeParse(metadata("NotARealIcon"));

    expect(result.success).toBe(false);
  });
});
