"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaType } from "@/generated/prisma";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

interface AssetCardProps {
  id: string;
  name: string;
  altText: string;
  url: string;
  type: MediaType;
  size: number;
  onCheckboxChange: (id: string, isChecked: boolean) => void;
}

export const AssetCard = ({
  id,
  name,
  altText,
  url,
  type,
  size,
  onCheckboxChange,
}: AssetCardProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const { onOpen } = useModal();

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onCheckboxChange(id, checked);
  };

  const onHandleEdit = () => {
    onOpen("editMediaAsset", undefined, { id, name, altText });
  };

  return (
    <div className="relative group hover:shadow-2xs transition overflow-hidden border rounded-lg h-full">
      <div className="absolute p-4 z-10 w-full flex items-center justify-between">
        <Checkbox checked={isChecked} onCheckedChange={handleCheckboxChange} />
        <Button variant="outline" size="sm" onClick={onHandleEdit}>
          Edit
        </Button>
      </div>
      <div className="relative w-full aspect-video rounded-md overflow-hidden">
        {type === MediaType.IMAGE && (
          <Image
            fill
            className="object-cover"
            alt={name}
            src={url}
            unoptimized
          />
        )}
        {type === MediaType.FILE && (
          <File className="absolute w-full h-full" strokeWidth={1} />
        )}
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
