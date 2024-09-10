"use client";

import { useEffect, useState } from "react";
import { CreateMediaModal } from "../modals/create-media-modal";
import { SelectAssetModal } from "../modals/select-asset-modal";
import { SelectUrlModal } from "../modals/select-url-modal";
import { EditLinkModal } from "../modals/edit-link-modal";

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
      <SelectUrlModal />
      <EditLinkModal />
    </>
  );
};
