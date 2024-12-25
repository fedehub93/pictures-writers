import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { WidgetCategoryType } from "@/types";
import { getWidgetCategories } from "@/data/widget";

interface WidgetCategoryProps {
  label: string;
  categoryType: WidgetCategoryType;
  limit: number;
}

export const WidgetCategory = async ({
  label,
  categoryType,
  limit,
}: WidgetCategoryProps) => {
  const categoriesData = await getWidgetCategories({
    categoryType,
    limit,
  });

  return (
    <div className="w-full bg-white px-6 py-8 shadow-md flex flex-col gap-y-2">
      <h3 className="mb-4 text-sm font-extrabold uppercase">{label}</h3>
      <div className="flex flex-col gap-y-2">
        {categoriesData.map((category) => (
          <Link
            key={category.title}
            href={`/blog/${category.slug}`}
            className="flex text-gray-500 md:max-w-xl xl:items-center hover:text-primary"
            prefetch={true}
          >
            <ChevronRight className="-ml-1 mr-1 xl:-mt-2" />
            <h5 className="upper mb-2 text-base leading-5 tracking-tight dark:text-white">
              {category.title}
            </h5>
          </Link>
        ))}
      </div>
    </div>
  );
};
