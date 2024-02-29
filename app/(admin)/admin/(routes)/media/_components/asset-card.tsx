"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaType } from "@prisma/client";

import { Checkbox } from "@/components/ui/checkbox";

interface AssetCardProps {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  onCheckboxChange: (id: string, isChecked: boolean) => void;
}

export const AssetCard = ({
  id,
  name,
  url,
  type,
  onCheckboxChange,
}: AssetCardProps) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onCheckboxChange(id, checked);
  };

  return (
    <div className="relative group hover:shadow-sm transition overflow-hidden border rounded-lg h-full">
      <div className="absolute top-4 left-4 z-10">
        <Checkbox checked={isChecked} onCheckedChange={handleCheckboxChange} />
      </div>
      <div className="relative w-full aspect-video rounded-md overflow-hidden">
        {type === MediaType.IMAGE && (
          <Image fill className="object-cover" alt={name} src={url} />
        )}
      </div>
      <div className="flex flex-col p-3">
        <div className="text-lg md:text-base font-medium group-hover:text-sky-700 transition line-clamp-2">
          {name}
        </div>
      </div>
    </div>
  );
};
