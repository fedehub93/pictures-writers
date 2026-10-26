import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Logo from "../logo";

describe("logo", () => {
  it("serves a density srcset of small webp assets instead of the 500px png", () => {
    const html = renderToStaticMarkup(<Logo />).toLowerCase();

    expect(html).toContain('src="/logo-48.webp"');
    expect(html).toContain(
      'srcset="/logo-48.webp 1x, /logo-96.webp 2x, /logo-144.webp 3x"',
    );
    expect(html).not.toContain("/logo.png");
  });

  it("reserves the 48x48 layout box before the image loads", () => {
    const html = renderToStaticMarkup(<Logo />);

    expect(html).toContain('width="48"');
    expect(html).toContain('height="48"');
  });
});
