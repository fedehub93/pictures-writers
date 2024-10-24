"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useProgressLoader } from "../_hooks/use-progress-loader-store";

export const ProgressLoader = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { isOpen, data } = useProgressLoader();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={cn(
        `fixed h-screen w-0 top-0 z-[1000] bg-black opacity-85 flex items-center justify-center text-white text-6xl font-bold transition-all duration-500`,
        isOpen && "w-screen"
      )}
    >
      <p className={cn(!isOpen && "hidden")}>
        {data.label} {data.progress && `${data.progress}%`}
      </p>
    </div>
  );
};
