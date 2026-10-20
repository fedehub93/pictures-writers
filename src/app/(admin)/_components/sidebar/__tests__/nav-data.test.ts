import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { filterNavData, getActiveNavUrl, navData } from "../nav-data";

const ROUTES_DIR = path.join(
  process.cwd(),
  "src/app/(admin)/admin/(routes)",
);

function section(label?: string) {
  return navData.find((entry) => entry.label === label);
}

function titlesOf(label?: string) {
  return section(label)?.items.map((item) => item.title) ?? [];
}

function urlsOf(label?: string) {
  return section(label)?.items.map((item) => item.url) ?? [];
}

function collectPages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectPages(full);
    return entry.name === "page.tsx" ? [full] : [];
  });
}

/**
 * URLs served by the route tree, with every route group removed: the URL does
 * not contain `(routes)` segments, so the check must not either.
 */
const PAGE_URLS = new Set(
  collectPages(ROUTES_DIR).map((file) => {
    const relative = path.relative(ROUTES_DIR, path.dirname(file));
    const segments = relative
      .split(path.sep)
      .filter((segment) => !/^\(.+\)$/.test(segment));
    return `/admin/${segments.join("/")}`;
  }),
);

function normalize(url: string) {
  return url.replace(/\/$/, "");
}

describe("admin navigation structure", () => {
  it("orders sections by job, with an unlabelled entry area on top", () => {
    expect(navData.map((entry) => entry.label)).toEqual([
      undefined,
      "Content",
      "Marketing",
      "Shop",
      "Automations",
      "Settings",
      "Access",
    ]);
  });

  it("keeps Dashboard and Inbox above the sections", () => {
    expect(titlesOf()).toEqual(["Dashboard", "Inbox"]);
    expect(urlsOf()).toEqual(["/admin/dashboard", "/admin/inbox"]);
  });

  it("groups publishing tools under Content", () => {
    expect(titlesOf("Content")).toEqual([
      "Pages",
      "Posts",
      "Media",
      "Schedule",
      "Categories",
      "Tags",
      "Widgets",
    ]);
  });

  it("groups outbound and inbound marketing under Marketing", () => {
    expect(titlesOf("Marketing")).toEqual([
      "Single Sends",
      "Templates",
      "Audiences",
      "Contacts",
      "Ads",
      "Forms",
      "Submissions",
    ]);
    expect(urlsOf("Marketing")).toEqual([
      "/admin/marketing/single-sends",
      "/admin/marketing/templates",
      "/admin/marketing/audiences",
      "/admin/marketing/contacts",
      "/admin/ads",
      "/admin/forms",
      "/admin/submissions",
    ]);
  });

  it("groups commerce under Shop", () => {
    expect(titlesOf("Shop")).toEqual([
      "Products",
      "Categories",
      "Reviews",
      "Customers",
      "Orders",
    ]);
  });

  it("groups automations under Automations", () => {
    expect(titlesOf("Automations")).toEqual(["All automations", "Credentials"]);
  });

  it("separates configuration from access", () => {
    expect(titlesOf("Settings")).toEqual([
      "General",
      "Integrations",
      "Email accounts",
      "Email settings",
    ]);
    expect(urlsOf("Settings")).toEqual([
      "/admin/settings",
      "/admin/integrations",
      "/admin/email-accounts",
      "/admin/email-settings",
    ]);
    expect(titlesOf("Access")).toEqual(["Users", "Roles"]);
  });

  it("points every entry at a distinct page that exists", () => {
    const urls = navData.flatMap((entry) =>
      entry.items.map((item) => item.url),
    );

    expect(new Set(urls).size).toBe(urls.length);

    for (const url of urls) {
      expect(
        PAGE_URLS.has(normalize(url)),
        `Missing page for ${url}`,
      ).toBe(true);
    }
  });
});

describe("getActiveNavUrl", () => {
  it("matches the entry of the current page", () => {
    expect(getActiveNavUrl(navData, "/admin/inbox")).toBe("/admin/inbox");
  });

  it("matches the parent entry of a detail page", () => {
    expect(getActiveNavUrl(navData, "/admin/marketing/templates/abc")).toBe(
      "/admin/marketing/templates",
    );
  });

  it("prefers the most specific entry when one is a prefix of another", () => {
    expect(
      getActiveNavUrl(navData, "/admin/automations/credentials"),
    ).toBe("/admin/automations/credentials");
    expect(getActiveNavUrl(navData, "/admin/automations/abc")).toBe(
      "/admin/automations/",
    );
  });

  it("matches a settings tab to the General entry", () => {
    expect(getActiveNavUrl(navData, "/admin/settings/seo")).toBe(
      "/admin/settings",
    );
  });

  it("returns nothing outside the navigation", () => {
    expect(getActiveNavUrl(navData, "/admin/profile")).toBeUndefined();
  });
});

describe("filterNavData", () => {
  it("keeps only the items the user can access", () => {
    const visible = filterNavData(navData, ["templates.read"]);

    expect(visible.map((entry) => entry.label)).toEqual(["Marketing"]);
    expect(visible[0]?.items.map((item) => item.title)).toEqual(["Templates"]);
  });

  it("drops a section once none of its items are visible", () => {
    const visible = filterNavData(navData, ["dashboard.read"]);

    expect(visible.map((entry) => entry.label)).toEqual([undefined]);
    expect(visible[0]?.items.map((item) => item.title)).toEqual(["Dashboard"]);
  });

  it("keeps the unlabelled area when either of its items is visible", () => {
    const visible = filterNavData(navData, [
      "dashboard.read",
      "mail.read",
    ]);

    expect(visible[0]?.items.map((item) => item.title)).toEqual([
      "Dashboard",
      "Inbox",
    ]);
    expect(visible).toHaveLength(1);
  });

  it("keeps both configuration and access for full permissions", () => {
    const visible = filterNavData(navData, [
      "settings.read",
      "integrations.read",
      "email-accounts.read",
      "email-settings.read",
      "users.read",
      "roles.read",
    ]);

    expect(visible.map((entry) => entry.label)).toEqual([
      "Settings",
      "Access",
    ]);
    expect(visible[0]?.items.map((item) => item.title)).toEqual([
      "General",
      "Integrations",
      "Email accounts",
      "Email settings",
    ]);
  });
});
