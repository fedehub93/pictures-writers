import { ContentStatus, ProductType } from "@prisma/client";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";
import { CategoryList } from "./_components/category-list";

const ShopPage = async () => {
  return redirect(`/shop/ebooks`);
  const categories = await db.productCategory.findMany({
    where: {
      status: "PUBLISHED",
      isLatest: true,
      products: {
        some: {
          status: ContentStatus.PUBLISHED,
          type: {
            in: [ProductType.EBOOK, ProductType.WEBINAR],
          },
        },
      },
    },
    select: {
      title: true,
      description: true,
      slug: true,
      products: {
        select: {
          rootId: true,
          title: true,
          description: true,
          slug: true,
          price: true,
          discountedPrice: true,
          imageCover: {
            select: {
              url: true,
              altText: true,
            },
          },
          metadata: true,
        },
        where: {
          status: ContentStatus.PUBLISHED,
          isLatest: true,
          type: {
            in: [ProductType.EBOOK, ProductType.WEBINAR],
          },
        },
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  return (
    <section className="bg-background">
      <div className="bg-primary w-full">
        <div className="max-w-6xl mx-auto h-20 flex justify-center items-center">
          <h1 className="text-foreground-primary font-extrabold text-4xl uppercase">Shop</h1>
        </div>
      </div>
      <div className="py-12">
        <div className="px-4 xl:px-0 lg:max-w-6xl mx-auto flex flex-col gap-y-4">
          <Breadcrumbs
            items={[{ title: "Home", href: "/" }, { title: "Shop" }]}
          />
          <div className="flex flex-col gap-y-4">
            {categories.map((c) => (
              <CategoryList
                key={c.title}
                title={c.title}
                description={c.description}
                slug={c.slug}
                products={c.products}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopPage;
