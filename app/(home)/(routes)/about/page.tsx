import { Metadata } from "next";
import Image from "next/image";
import { SocialIcon } from "react-social-icons";
import { UserRole } from "@/prisma/generated/client";
import { db } from "@/lib/db";
import { Separator } from "@/components/ui/separator";
import { getHeadMetadata } from "../../_components/seo/head-metadata";
import { getSettings } from "@/data/settings";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  const { siteUrl } = await getSettings();

  return {
    ...metadata,
    title: "Chi siamo: Pictures Writers",
    description:
      "Pictures Writers nasce per diventare un canale centrale per gli sceneggiatori italiani, fare network creando un community e offrire servizio a scopo educativo per questo fantastico mestiere cinematografico.",
    alternates: {
      canonical: `${siteUrl}/about/`,
    },
  };
}

const AboutPage = async () => {
  const authors = await db.user.findMany({
    where: {
      role: { in: [UserRole.ADMIN, UserRole.EDITOR] },
    },
  });
  return (
    <>
      <section className="px-4 pt-20 lg:px-6">
        <div className="mx-auto max-w-lg md:max-w-(--breakpoint-md) lg:max-w-6xl">
          <h1 className="mb-4 text-center text-3xl font-bold">Chi siamo</h1>
          <p className="mx-auto max-w-lg text-center ">
            Siamo un team appassionato che si impegna a fornirti tutto ciò di
            cui hai bisogno per diventare uno
            <span className="evidence">sceneggiatore di successo</span>e a
            nutrire la tua fiamma creativa.
          </p>
          <div className="grid grid-cols-1 items-center gap-x-16 md:grid-cols-2">
            <div className="md:order-1 aspect-square">
              <Image
                src="/about-us.png"
                alt="Feature"
                width={2000}
                height={2000}
                className="h-auto w-full"
              />
            </div>

            <div className="md:order-2">
              <p className="uppercase text-heading text-muted-foreground">
                Mission
              </p>
              <h2 className="mt-4 text-2xl font-bold">
                Perfezionare il mestiere dello sceneggiatore.
              </h2>
              <p className="mt-2 ">
                Pictures Writers nasce da una grande passione per le storie, ed
                in particolare per quelle raccontate attraverso il mezzo
                cinematografico.
                <br />
                <br />
                La nostra missione è semplice ma potente:{" "}
                <span className="evidence">
                  alimentare la tua passione per la scrittura,
                </span>
                offrendoti ispirazione, istruzione e una comunità di supporto
                dedicata.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="px-4 py-20 lg:px-6">
        <div className="w-full text-center text-3xl font-bold mb-4">
          Gli autori
        </div>
        <p className="mx-auto max-w-lg text-center mb-12">
          I volti e le penne instancabili che si nascondono dietro ai contenuti
          della nostra realtà.
        </p>
        <div className="flex max-w-7xl mx-auto gap-x-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {authors.map((author) => (
              <div
                key={author.id}
                className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 "
              >
                <Image
                  src={author.imageUrl!}
                  alt="Foto profilo Federico Verrengia"
                  width={250}
                  height={250}
                  sizes="90vw"
                  className="aspect-square mx-auto block rounded-full border-2 border-neutral-200 grayscale object-cover"
                />
                <div className="flex flex-col gap-y-2 text-center md:text-left">
                  <div className="text-xl font-medium">
                    {author.firstName} {author.lastName}
                  </div>
                  <div className="text-base text-muted-foreground">
                    {author.role === "ADMIN"
                      ? "Fondatore"
                      : "Collaboratore e Articolista"}
                  </div>
                  <Separator />
                  <p className="mx-auto max-w-4xl text-sm mb-2">{author.bio}</p>
                  <div className="gap-x-4 hidden">
                    <SocialIcon
                      network="linkedin"
                      bgColor="black"
                      style={{ height: 45, width: 45 }}
                    />
                    <SocialIcon
                      network="instagram"
                      bgColor="black"
                      style={{ height: 45, width: 45 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
