import { Media } from "@prisma/client";

import { AssetCard } from "./asset-card";

interface CoursesListProps {
  items: Media[];
}

export const AssetsList = ({ items }: CoursesListProps) => {
  return (
    <div>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <AssetCard
            key={item.id}
            id={item.id}
            name={item.name}
            url={item.url}
            type={item.type}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          No assets found
        </div>
      )}
    </div>
  );
};
