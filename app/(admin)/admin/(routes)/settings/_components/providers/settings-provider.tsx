"use client";

import { Seo, Settings, SocialChannel } from "@prisma/client";
import { createContext, useContext } from "react";

type SettingsWithSeoWithSocials = Settings & {
  seo: Seo | null;
  socials: SocialChannel[];
};

interface SettingsContextProps {
  settings: SettingsWithSeoWithSocials | null;
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
