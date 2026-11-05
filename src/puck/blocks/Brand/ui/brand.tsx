import type { BrandBlockUiProps } from "../types";

export const BrandBlockUi = ({
  showLogo = true,
  showSiteName = true,
  customText,
  customLogoUrl,
  siteName,
  logoUrl,
}: BrandBlockUiProps) => {
  const text = customText?.trim() || siteName?.trim();
  const src = customLogoUrl?.trim() || logoUrl?.trim();

  if (!(showLogo && src) && !(showSiteName && text)) return null;

  return (
    <div className="flex items-center gap-x-3">
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
        <span className="text-lg font-semibold uppercase tracking-widest">
          {text}
        </span>
      ) : null}
    </div>
  );
};
