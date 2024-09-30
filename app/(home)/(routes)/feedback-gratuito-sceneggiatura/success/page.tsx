import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";

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

const FirstImpressionSuccess = async () => {
  return (
    <section className="h-full w-full items-center">
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-8 px-5 py-12 text-center">
        <Image
          src="/successful.png"
          alt="Success"
          width={200}
          height={200}
          className="mx-auto block md:max-w-xs "
        />
        <h3 className="text-lg font-extrabold uppercase text-heading xl:text-xl">
          Abbiamo ricevuto la tua sceneggiatura.
        </h3>
        <p>
          Uno dei nostri collaboratori prenderà in carico il tuo lavoro al più
          presto possibile.
          <br /> Invieremo le note alla casella email che ci hai fornito. Non
          vediamo l&apos;ora di metterci a lavoro.
        </p>
        <p>
          Nel frattempo perché non dai un&apos;occhiata alle{" "}
          <strong>ultime news</strong> del nostro blog?
        </p>
        <Button className="mt-2">
          <Link href="/">Torna alla home</Link>
        </Button>
      </div>
    </section>
  );
};

export default FirstImpressionSuccess;
