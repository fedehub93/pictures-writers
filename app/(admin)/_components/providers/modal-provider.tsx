"use client";
import { useEffect, useState } from "react";
import { EditLinkModal } from "../modals/edit-link-modal";
import { CreateMediaModal } from "../modals/create-media-modal";

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
    </>
  );
};
