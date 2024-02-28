import Image from "next/image";
import Link from "next/link";
import { MediaType } from "@prisma/client";

interface AssetCardProps {
  id: string;
  name: string;
  url: string;
  type: MediaType;
}

export const AssetCard = ({ id, name, url, type }: AssetCardProps) => {
  return (
    <Link href={`/admin/media/${id}`}>
      <div className="group hover:shadow-sm transition overflow-hidden border rounded-lg p-3 h-full">
        <div className="relative w-full aspect-video rounded-md overflow-hidden">
          {type === MediaType.IMAGE && (
            <Image fill className="object-cover" alt={name} src={url} />
          )}
        </div>
        <div className="flex flex-col pt-2">
          <div className="text-lg md:text-base font-medium group-hover:text-sky-700 transition line-clamp-2">
            {name}
          </div>
        </div>
      </div>
    </Link>
  );
};
