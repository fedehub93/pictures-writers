import { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { isValidEbookFormat } from "@/type-guards";

import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  return {
    ...metadata,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

const DownloadEbook = async (props: PageProps<"/shop/ebooks/download">) => {
  const searchParams = await props.searchParams;
  const ebookId = searchParams?.id || "";
  const format =
    typeof searchParams?.format === "string" ? searchParams?.format : "";

  if (!isValidEbookFormat(format)) {
    return <div>Qualcosa è andato storto!</div>;
  }

  return (
    <section className="h-full w-full items-center">
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-8 px-5 py-40 text-center">
        <h1 className="text-3xl font-extrabold text-gray-300 xl:text-7xl">
          Grazie
        </h1>
        <h2 className="text-lg font-extrabold uppercase text-heading xl:text-xl">
          Il download dovrebbe partire entro pochi secondi.
        </h2>
        <p>Se così non fosse puoi cliccare il link qui sotto.</p>
        <div className="flex">
          <a
            href={`/api/products/download?id=${ebookId}&format=${format}`}
            className="mr-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-foreground-primary transition-all duration-500 hover:-translate-y-1 hover:shadow-xl focus:outline-hidden lg:px-5 lg:py-2.5"
          >
            Download
          </a>

          <Button variant="outline">
            <Link href="/">Torna alla home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DownloadEbook;
