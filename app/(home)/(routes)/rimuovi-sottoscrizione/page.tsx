import { Metadata } from "next";
import { Suspense } from "react";

import { getHeadMetadata } from "../../_components/seo/head-metadata";
import { RemoveSubscriptionForm } from "./_components/remove-subscription-form";
import { getSettings } from "@/data/settings";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();
  const { siteUrl } = await getSettings();

  return {
    ...metadata,
    title: "Pictures Writers | Rimuovi Sottoscrizione",
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    alternates: {
      canonical: `${siteUrl}/conferma-sottoscrizione/`,
    },
  };
}

const RemoveSubscriptionPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RemoveSubscriptionForm />
    </Suspense>
  );
};

export default RemoveSubscriptionPage;
