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

const DownloadEbook = async (props: PageProps<"/shop/[categorySlug]/download">) => {
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
        <h1 className="text-3xl font-extrabold text-primary xl:text-7xl">
          Grazie
        </h1>
        <h2 className="text-xl font-extrabold text-heading xl:text-2xl">
          Il download dovrebbe partire entro pochi secondi.
        </h2>
        <p>Se così non fosse puoi cliccare il link qui sotto.</p>
        <div className="flex">
          <Button asChild>
            <a
              href={`/api/products/download?id=${ebookId}&format=${format}`}
              className="mr-2 rounded-lg bg-primary text-primary-foreground"
            >
              Download
            </a>
          </Button>

          <Button variant="outline">
            <Link href="/">Torna alla home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DownloadEbook;
