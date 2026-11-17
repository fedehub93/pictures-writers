import { RootConfig } from "@puckeditor/core";

import { RootEditor } from "./index";
import { HeaderStickyField } from "./header-sticky-field";
import { renderRoot } from "./render";
import type { RootProps } from "./types";

export type HeaderRootProps = RootProps & {
  /**
   * Hold the Header region at the top of the viewport while the page scrolls.
   * Absent or non-boolean values mean normal flow.
   */
  sticky?: boolean;
};

/**
 * Root config for the Header region only.
 *
 * Pages and the Footer keep sharing `RootEditor`: the sticky switch is a
 * property of the Header region, not of every document root.
 */
export const HeaderRootEditor: RootConfig<HeaderRootProps> = {
  fields: {
    ...RootEditor.fields,
    sticky: HeaderStickyField,
  },
  render: renderRoot,
};
