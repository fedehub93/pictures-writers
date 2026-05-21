"use client";

import { useEffect, useState } from "react";
import { EditContentImageSheet } from "../sheets/edit-content-image";

export const SheetProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <EditContentImageSheet />
    </>
  );
};
