import { Metadata } from "next";
import { Suspense } from "react";

import { getHeadMetadata } from "../../_components/seo/head-metadata";
import { RemoveSubscriptionForm } from "./_components/remove-subscription-form";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

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
