import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "@/shared/lib/permissions";
import { AuthorizationProvider } from "@/shared/providers/authorization-provider";

import { SiteRegionEditAction } from "../site-region-edit-action";

const renderWithPermissions = (permissionKeys: string[]) =>
  renderToStaticMarkup(
    <AuthorizationProvider permissionKeys={permissionKeys}>
      <SiteRegionEditAction regionKey="HEADER" />
    </AuthorizationProvider>,
  );

describe("SiteRegionEditAction", () => {
  it("links to the editor when the user can update the layout", () => {
    const html = renderWithPermissions([PERMISSIONS.SITE_LAYOUT_UPDATE]);

    expect(html).toContain("Edit layout");
    expect(html).toContain('href="/admin/site-regions/HEADER"');
  });

  it("renders nothing without the update permission", () => {
    const html = renderWithPermissions([PERMISSIONS.SITE_LAYOUT_READ]);

    expect(html).toBe("");
  });
});
