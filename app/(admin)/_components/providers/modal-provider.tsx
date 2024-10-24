"use client";

import { useEffect, useState } from "react";
import { CreateMediaModal } from "../modals/create-media-modal";
import { SelectAssetModal } from "../modals/select-asset-modal";
import { SelectUrlModal } from "../modals/select-url-modal";
import { EditLinkModal } from "../modals/edit-link-modal";
import { EditMediaModal } from "../modals/edit-media-modal";
import { ImportAudienceContacts } from "../modals/import-audience-contacts";

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
      <EditMediaModal />
      <SelectAssetModal />
      <SelectUrlModal />
      <EditLinkModal />
      <ImportAudienceContacts />
    </>
  );
};
