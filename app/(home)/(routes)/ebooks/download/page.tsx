import Link from "next/link";
import { Button } from "@/components/ui/button";

const DownloadEbook = ({
  searchParams,
}: {
  searchParams?: {
    id?: string;
  };
}) => {
  const ebookId = searchParams?.id || "";
  return (
    <section className="h-full w-full items-center">
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-8 px-5 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-gray-300 xl:text-7xl">
          Grazie
        </h1>
        <h2 className="text-lg font-extrabold uppercase text-heading xl:text-xl">
          Il download dovrebbe partire entro pochi secondi.
        </h2>
        <p>Se così non fosse puoi cliccare il link qui sotto.</p>
        <div className="flex">
          <a
            href={`/api/ebooks/download?id=${ebookId}`}
            className="mr-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-all duration-500 hover:-translate-y-1 hover:shadow-xl focus:outline-none lg:px-5 lg:py-2.5"
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
