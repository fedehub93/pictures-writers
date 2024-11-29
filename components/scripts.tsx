import Script from "next/script";

import { SettingsScripts } from "@/types";

export default async function AppScripts({
  scripts,
}: {
  scripts: SettingsScripts[] | undefined | null;
}) {
  if (!scripts || !scripts.length) return;

  return (
    <>
      {/* Configurazione inline dello script */}
      {scripts.map((s) => {
        if (!s.enabled) return null;

        if (s.content) {
          return (
            <Script key={s.name} id={s.name} strategy={s.strategy}>
              {s.content}
            </Script>
          );
        }

        return (
          <Script key={s.name} id={s.name} src={s.src} strategy={s.strategy} />
        );
      })}
    </>
  );
}
