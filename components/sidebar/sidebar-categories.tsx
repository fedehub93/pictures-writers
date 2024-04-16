import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { getPublishedCategories } from "@/lib/category";

export const SidebarCategories = async () => {
  const categories = await getPublishedCategories();

  return (
    <div className="w-full bg-white px-6 py-8 shadow-md flex flex-col gap-y-2">
      <h3 className="mb-4 text-sm font-extrabold uppercase">Categorie</h3>
      <div className="flex flex-col gap-y-2">
        {categories.map((category) => (
          <Link
            key={category.title}
            href={`/blog/${category.slug}`}
            className="flex text-gray-500 md:max-w-xl xl:items-center"
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

export default SidebarCategories;
