import Script from "next/script";

import { resolveScriptStrategy, SettingsScripts } from "@/types";

const getSrc = (src: string | undefined) => {
  if (!src) return src;

  return src.startsWith("//") ? `https:${src}` : src;
};

export const AppScripts = async ({
  scripts,
}: {
  scripts: SettingsScripts[] | undefined | null;
}) => {
  if (!scripts || !scripts.length) return;

  return (
    <>
      {scripts.map((s) => {
        if (!s.enabled) return null;

        const strategy = resolveScriptStrategy(s.strategy);

        if (s.content) {
          return (
            <Script key={s.name} id={s.name} strategy={strategy}>
              {s.content}
            </Script>
          );
        }

        return (
          <Script key={s.name} id={s.name} src={getSrc(s.src)} strategy={strategy} />
        );
      })}
    </>
  );
};
