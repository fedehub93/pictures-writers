"use client";

import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";

export const BuyButton = ({
  setIsOpen,
}: {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const onHandleClick = () => {
    setIsOpen(true);
  };
  return <Button onClick={onHandleClick}>Scarica con 1-Click</Button>;
};
