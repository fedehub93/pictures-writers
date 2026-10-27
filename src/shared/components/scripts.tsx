import Script from "next/script";

import { ScriptStrategy, SettingsScripts } from "@/types";

const getStrategy = (script: SettingsScripts): ScriptStrategy | undefined => {
  if (!script.src) return script.strategy;

  if (script.src.includes("cs.iubenda.com/sync/")) {
    return ScriptStrategy.lazyOnLoad;
  }

  if (script.src.includes("cdn.iubenda.com/cs/iubenda_cs.js")) {
    return ScriptStrategy.beforeInteractive;
  }

  if (script.src.includes("iubenda.com")) {
    return ScriptStrategy.afterInteractive;
  }

  if (script.strategy === ScriptStrategy.beforeInteractive) {
    return ScriptStrategy.afterInteractive;
  }

  return script.strategy;
};

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
      {/* Configurazione inline dello script */}
      {scripts.map((s) => {
        if (!s.enabled) return null;

        const strategy = getStrategy(s);

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
