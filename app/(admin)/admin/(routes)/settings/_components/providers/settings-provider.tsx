"use client";

import { Seo, Settings, SocialChannel, Language } from "@/generated/prisma";
import { createContext, useContext } from "react";

type SettingsWithSeoWithSocialsLanguages = Settings & {
  seo: Seo | null;
  socials: SocialChannel[];
  languages: Language[];
};

interface SettingsContextProps {
  settings: SettingsWithSeoWithSocialsLanguages | null;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(
  undefined
);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettings deve essere utilizzato all'interno di SettingsProvider"
    );
  }
  return context;
};

export const SettingsProvider = ({
  settings,
  children,
}: {
  settings: any;
  children: React.ReactNode;
}) => (
  <SettingsContext.Provider value={{ settings }}>
    {children}
  </SettingsContext.Provider>
);
