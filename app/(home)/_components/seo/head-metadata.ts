import { Metadata } from "next";

export async function getHeadMetadata(): Promise<Metadata> {
  return {
    title: "Pictures Writers: Affina la tua scrittura cinematografica",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    description:
      "Pictures Writers è una rete e un centro di informazioni per chi vuole diventare uno sceneggiatore cinematografico, per chi vuole imparare il mestiere, per chi vuole scrivere per il cinema",
    openGraph: {
      url: "https://pictureswriters.com",
      type: "website",
    },
  };
}
