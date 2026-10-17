import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { MAIL_SECTIONS } from "@/modules/mails/lib/sections";

import { filterNavData, navData } from "../nav-data";

const MAIL_ROUTES_DIR = path.join(
  process.cwd(),
  "src/app/(admin)/admin/(routes)/mails/(routes)",
);

function findMails(visible = navData) {
  const mails = visible.tools?.find((item) => item.title === "Mails");
  if (!mails) throw new Error("Mails nav entry is missing");
  return mails;
}

function urlsOf(items: { url: string }[] | undefined) {
  return items?.map((item) => item.url) ?? [];
}

describe("mails navigation structure", () => {
  it("splits Mails into Marketing and Conversations groups", () => {
    const mails = findMails();

    expect(MAIL_SECTIONS.marketing).toBe("Marketing");
    expect(MAIL_SECTIONS.conversations).toBe("Conversations");
    expect(mails.groups?.map((group) => group.label)).toEqual([
      MAIL_SECTIONS.marketing,
      MAIL_SECTIONS.conversations,
    ]);
  });

  it("groups the marketing features under Marketing", () => {
    const marketing = findMails().groups?.find(
      (group) => group.label === MAIL_SECTIONS.marketing,
    );

    expect(marketing?.items.map((item) => item.title)).toEqual([
      "Templates",
      "Audiences",
      "Contacts",
      "Single Sends",
    ]);
    expect(urlsOf(marketing?.items)).toEqual([
      "/admin/mails/marketing/templates",
      "/admin/mails/marketing/audiences",
      "/admin/mails/marketing/contacts",
      "/admin/mails/marketing/single-sends",
    ]);
  });

  it("groups Inbox and Accounts under Conversations", () => {
    const conversations = findMails().groups?.find(
      (group) => group.label === MAIL_SECTIONS.conversations,
    );

    expect(conversations?.items.map((item) => item.title)).toEqual([
      "Inbox",
      "Accounts",
    ]);
    expect(urlsOf(conversations?.items)).toEqual([
      "/admin/mails/conversations/inbox",
      "/admin/mails/conversations/accounts",
    ]);
  });

  it("keeps Settings outside the two groups", () => {
    const mails = findMails();

    expect(mails.items?.map((item) => [item.title, item.url])).toEqual([
      ["Settings", "/admin/mails/settings"],
    ]);
  });

  it("points every Mails entry at a distinct page", () => {
    const mails = findMails();
    const urls = [
      ...urlsOf(mails.groups?.flatMap((group) => group.items)),
      ...urlsOf(mails.items),
    ];

    expect(urls).not.toContain("#");
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("points every Mails entry at a page that exists", () => {
    const mails = findMails();
    const urls = [
      ...urlsOf(mails.groups?.flatMap((group) => group.items)),
      ...urlsOf(mails.items),
    ];

    for (const url of urls) {
      const relative = url.replace("/admin/mails/", "");
      expect(
        existsSync(path.join(MAIL_ROUTES_DIR, relative, "page.tsx")),
        `Missing page for ${url}`,
      ).toBe(true);
    }
  });
});

describe("filterNavData", () => {
  it("hides group items the user cannot access", () => {
    const visible = filterNavData(navData, ["templates.read"]);
    const mails = findMails(visible);

    expect(mails.groups?.map((group) => group.label)).toEqual(["Marketing"]);
    expect(mails.groups?.[0]?.items.map((item) => item.title)).toEqual([
      "Templates",
    ]);
  });

  it("drops a group once none of its items are visible", () => {
    const visible = filterNavData(navData, ["single-sends.read"]);
    const mails = findMails(visible);

    expect(mails.groups?.map((group) => group.label)).toEqual(["Marketing"]);
    expect(mails.groups?.[0]?.items.map((item) => item.title)).toEqual([
      "Single Sends",
    ]);
  });

  it("drops the Mails parent when the user has no mail permissions", () => {
    const visible = filterNavData(navData, ["dashboard.read"]);

    expect(visible.tools?.find((item) => item.title === "Mails")).toBeUndefined();
  });

  it("keeps both groups for a user with full mail access", () => {
    const visible = filterNavData(navData, [
      "templates.read",
      "audiences.read",
      "contacts.read",
      "single-sends.read",
      "mail.read",
      "email-accounts.read",
      "email-settings.read",
    ]);
    const mails = findMails(visible);

    expect(mails.groups?.map((group) => group.label)).toEqual([
      "Marketing",
      "Conversations",
    ]);
    expect(mails.items?.map((item) => item.title)).toEqual(["Settings"]);
  });
});
