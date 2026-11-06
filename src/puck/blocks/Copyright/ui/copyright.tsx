import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";

import { COPYRIGHT_DEFAULT_CONTENT } from "../defaults";
import type { CopyrightBlockUiProps } from "../types";

export const CopyrightBlockUi = ({
  content,
  siteName,
  year = new Date().getFullYear(),
  styleVars,
}: CopyrightBlockUiProps) => {
  const showYear = content?.showYear ?? COPYRIGHT_DEFAULT_CONTENT.showYear;
  const extraText = content?.extraText;
  const links = content?.links ?? COPYRIGHT_DEFAULT_CONTENT.links;

  const name = siteName?.trim();
  const symbol = showYear ? `© ${year}` : "©";

  return (
    <p
      className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 puck-dim puck-typo"
      style={styleVars}
    >
      <span>{name ? `${symbol} ${name}` : symbol}</span>
      {extraText?.trim() ? <span>{extraText.trim()}</span> : null}
      {links.map((item, index) =>
        item?.link ? (
          <InlineSmartLink key={index} link={item.link} />
        ) : null,
      )}
    </p>
  );
};
