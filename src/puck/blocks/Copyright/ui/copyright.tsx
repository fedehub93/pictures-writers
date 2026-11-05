import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";

import type { CopyrightBlockUiProps } from "../types";

export const CopyrightBlockUi = ({
  siteName,
  year = new Date().getFullYear(),
  showYear = true,
  extraText,
  links = [],
}: CopyrightBlockUiProps) => {
  const name = siteName?.trim();
  const symbol = showYear ? `© ${year}` : "©";

  return (
    <p className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-sm">
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
