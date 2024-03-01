"use client";

import { useEffect, useState } from "react";
import { CreateMediaModal } from "../modals/create-media-modal";
import { SelectAssetModal } from "../modals/select-asset-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CreateMediaModal />
      <SelectAssetModal />
    </>
  );
};
