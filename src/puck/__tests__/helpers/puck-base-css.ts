import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The shared stylesheet as text.
 *
 * The containing-block contract (`position: relative` on a block root) only
 * exists in `puck-base.css`, so a happy-dom test that wants to assert the
 * *computed* position has to install the real file instead of restating the
 * declaration. That way a rule removed from the stylesheet fails the test.
 */
const PUCK_BASE_CSS = readFileSync(
  resolve(process.cwd(), "src/puck/styles/puck-base.css"),
  "utf8",
);

/** Installs `puck-base.css` into the current document; returns a cleanup. */
export function installPuckBaseStyles() {
  const style = document.createElement("style");
  style.textContent = PUCK_BASE_CSS;
  document.head.appendChild(style);

  return () => style.remove();
}
