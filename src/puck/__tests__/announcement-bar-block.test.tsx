import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnnouncementBarBlockUi } from "../blocks/AnnouncementBar/ui/announcement-bar";

describe("AnnouncementBar block", () => {
  it("renders a thin banner with the configured text", () => {
    const html = renderToStaticMarkup(
      <AnnouncementBarBlockUi text="Free shipping this week" />,
    );

    expect(html).toContain("Free shipping this week");
  });

  it("applies the configured background and text colors", () => {
    const html = renderToStaticMarkup(
      <AnnouncementBarBlockUi
        text="Sale"
        backgroundColor="var(--accent)"
        textColor="var(--accent-foreground)"
      />,
    );

    expect(html).toContain("background-color:var(--accent)");
    expect(html).toContain("color:var(--accent-foreground)");
  });

  it("falls back to the primary palette when no colors are set", () => {
    const html = renderToStaticMarkup(<AnnouncementBarBlockUi text="Sale" />);

    expect(html).toContain("bg-primary");
    expect(html).toContain("text-primary-foreground");
  });

  it("wraps the message in a link when the target is resolved", () => {
    const html = renderToStaticMarkup(
      <AnnouncementBarBlockUi
        text="Read the news"
        link={{
          label: "Read the news",
          href: "https://example.com/news",
          openInNewTab: true,
        }}
      />,
    );

    expect(html).toContain('href="https://example.com/news"');
    expect(html).toContain('target="_blank"');
  });

  it("renders plain text when an entity link could not be resolved", () => {
    const html = renderToStaticMarkup(
      <AnnouncementBarBlockUi
        text="Draft page"
        link={{ type: "page", pageId: "missing" }}
      />,
    );

    expect(html).toContain("Draft page");
    expect(html).not.toContain("<a ");
  });

  it("only renders the close button when the banner is dismissible", () => {
    const closable = renderToStaticMarkup(
      <AnnouncementBarBlockUi id="bar" text="Sale" dismissible />,
    );
    const persistent = renderToStaticMarkup(
      <AnnouncementBarBlockUi id="bar" text="Sale" />,
    );

    expect(closable).toContain('aria-label="Dismiss announcement"');
    expect(persistent).not.toContain('aria-label="Dismiss announcement"');
  });

  it("keeps the banner visible while editing, without a runtime close button", () => {
    const html = renderToStaticMarkup(
      <AnnouncementBarBlockUi
        id="bar"
        text="Sale"
        dismissible
        editMode
      />,
    );

    expect(html).toContain("Sale");
    expect(html).not.toContain('aria-label="Dismiss announcement"');
  });

  it("renders nothing when the text is empty", () => {
    const html = renderToStaticMarkup(<AnnouncementBarBlockUi text="   " />);

    expect(html).toBe("");
  });
});
