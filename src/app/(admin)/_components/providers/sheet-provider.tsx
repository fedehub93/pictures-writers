"use client";

import { useHydrated } from "@/shared/hooks/use-hydrated";
import { EditContentImageSheet } from "../sheets/edit-content-image";

export const SheetProvider = () => {
  const isHydrated = useHydrated();

  if (!isHydrated) {
    return null;
  }

  return (
    <>
      <EditContentImageSheet />
    </>
  );
};
