"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaType } from "@prisma/client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";
import { File } from "lucide-react";

interface AssetCardProps {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  size: number;
  onCheckboxChange: (id: string, isChecked: boolean) => void;
}

export const AssetCard = ({
  id,
  name,
  url,
  type,
  size,
  onCheckboxChange,
}: AssetCardProps) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onCheckboxChange(id, checked);
  };

  return (
    <div className="relative group hover:shadow-sm transition overflow-hidden border rounded-lg h-full">
      <div className="absolute p-4 z-10 w-full flex items-center justify-between">
        <Checkbox checked={isChecked} onCheckedChange={handleCheckboxChange} />
      </div>
      <div className="relative w-full aspect-video rounded-md overflow-hidden">
        {type === MediaType.IMAGE && (
          <Image fill className="object-cover" alt={name} src={url} />
        )}
        {type === MediaType.FILE && <File className="absolute w-full h-full" strokeWidth={1} />}
      </div>
      <div className="flex flex-col gap-y-2 p-3">
        <div className="flex justify-between items-center gap-x-4">
          <div className="text-sm truncate font-medium group-hover:text-sky-700 transition">
            {name}
          </div>
          <Badge>{type}</Badge>
        </div>
        <div className="flex justify-between items-center gap-x-4">
          <div className="text-sm truncate font-medium group-hover:text-sky-700 transition">
            {formatBytes(size)}
          </div>
        </div>
      </div>
    </div>
  );
};
