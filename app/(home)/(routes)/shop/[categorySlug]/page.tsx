import type { ReactNode } from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ContentStatus, ProductType } from "@/generated/prisma";

import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";

import { getSettings } from "@/data/settings";
import { getPublishedProductCategoryBySlug } from "@/data/product-category";
import { getProductsPaginatedByFilters } from "@/data/product";

import { ProductsList } from "./_components/products-list";

type PresetCategory = {
  slug: string;
  badge: string;
  emphasized: string;
  paragraph: ReactNode;
};

const PRESET_CATEGORIES: PresetCategory[] = [
  {
    slug: "servizi-editoriali",
    badge: 'Analisi professionale "Double View"',
    emphasized: "Servizi Editoriali",
    paragraph: (
      <>
        Il nostro servizio di analisi non è una semplice lettura, ma un check-up
        completo eseguito da
        <span className="text-foreground font-bold">
          {" "}
          entrambi i nostri consulenti{" "}
        </span>
        per garantirti due punti di vista professionali complementari.
      </>
    ),
  },
  {
    slug: "corsi-di-sceneggiatura",
    badge: "Laboratori di sviluppo attivo",
    emphasized: "Corsi & Masterclass",
    paragraph: (
      <>
        Trasforma la tua intuizione in una struttura narrativa solida. I nostri
        percorsi mettono al centro il tuo progetto, affiancandoti nello
        <span className="text-foreground font-bold">
          {" "}
          sviluppo concreto della tua idea{" "}
        </span>
        fino alla stesura di un soggetto professionale pronto per il mercato.
      </>
    ),
  },
  {
    slug: "ebooks",
    badge: "Strumenti operativi pronti all'uso",
    emphasized: "Ebooks & Guide",
    paragraph: (
      <>
        Accedi a una libreria di manuali strategici e blueprint basati su
        <span className="text-foreground font-bold">
          {" "}
          standard internazionali{" "}
        </span>
        per risolvere problemi strutturali e potenziare ogni fase della tua
        creatività.
      </>
    ),
  },
];

export async function generateMetadata(
  props: PageProps<"/shop/[categorySlug]">,
): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();
  const { categorySlug } = await props.params;
  const category = await getPublishedProductCategoryBySlug({
    slug: categorySlug,
  });

  const { siteShopUrl } = await getSettings();

  return {
    ...metadata,
    title: category?.seo?.title,
    description: category?.seo?.description,
    alternates: {
      canonical: `${siteShopUrl}/${categorySlug}/`,
    },
  };
}

const ShopCategoryPage = async (props: PageProps<"/shop/[categorySlug]">) => {
  const { categorySlug } = await props.params;

  const category = await getPublishedProductCategoryBySlug({
    slug: categorySlug,
  });

  const { products } = await getProductsPaginatedByFilters({
    where: {
      category: {
        slug: categorySlug,
        status: ContentStatus.PUBLISHED,
      },
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      type: {
        not: ProductType.AFFILIATE,
      },
    },
    page: 1,
  });

  if (!category || !products.length) {
    return redirect(`/shop/ebooks`);
  }

  const preset = PRESET_CATEGORIES.find((p) => p.slug === categorySlug);

  const badgeText = preset?.badge ?? 'Analisi Professionale "Double View"';
  const emphasizedText = preset?.emphasized ?? "Servizi Editoriali";
  const paragraph = preset?.paragraph ?? (
    <>
      Il nostro servizio di analisi non è una semplice lettura, ma un check-up
      completo eseguito da
      <span className="text-foreground font-bold">
        {" "}
        entrambi i nostri consulenti{" "}
      </span>
      per garantirti due punti di vista professionali complementari.
    </>
  );

  return (
    <div className="bg-background">
      <div className="py-8 mx-auto grid w-full max-w-6xl grid-cols-1 px-4 md:grid-cols-2 space-y-6 gap-x-12">
        <Breadcrumbs
          items={[
            { title: "Home", href: "/" },
            { title: "Shop", href: `/shop/` },
            {
              title: category.title,
              href: `/shop/${category.slug}/`,
            },
          ]}
        />
      </div>
      <section className="pb-12 border-b border-b-accent">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-widest mb-6">
            {badgeText}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-8 leading-tight">
            I Nostri{" "}
            <span className="text-primary italic">{emphasizedText}</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            {paragraph}
          </p>
        </div>
      </section>
      <section className="bg-white">
        <div className="py-6 px-4 xl:px-0 lg:max-w-6xl mx-auto flex flex-col gap-y-4">
          <ProductsList products={products} categorySlug={categorySlug} />
        </div>
      </section>
    </div>
  );
};

export default ShopCategoryPage;
