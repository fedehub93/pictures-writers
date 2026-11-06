import { BRAND_DEFAULT_CONTENT } from "../defaults";
import type { BrandBlockUiProps } from "../types";

export const BrandBlockUi = ({
  content,
  siteName,
  logoUrl,
  styleVars,
}: BrandBlockUiProps) => {
  const {
    showLogo = BRAND_DEFAULT_CONTENT.showLogo,
    showSiteName = BRAND_DEFAULT_CONTENT.showSiteName,
    customText,
    customLogoUrl,
  } = content ?? {};
  const text = customText?.trim() || siteName?.trim();
  const src = customLogoUrl?.trim() || logoUrl?.trim();

  if (!(showLogo && src) && !(showSiteName && text)) return null;

  return (
    <div
      className="flex items-center gap-x-3 puck-dim puck-typo"
      style={styleVars}
    >
      {showLogo && src ? (
        // The logo comes from Installation settings with unknown dimensions,
        // so next/image cannot infer width/height or a rendition ladder.
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary settings URL
        <img
          src={src}
          alt={text || "Logo"}
          width={48}
          height={48}
          loading="eager"
          decoding="async"
          className="h-12 w-auto object-contain"
        />
      ) : null}
      {showSiteName && text ? (
        <span className="uppercase">{text}</span>
      ) : null}
    </div>
  );
};
