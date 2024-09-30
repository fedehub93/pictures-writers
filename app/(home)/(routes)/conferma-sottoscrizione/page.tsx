import { Metadata } from "next";

import { getHeadMetadata } from "../../_components/seo/head-metadata";
import { NewSubscriptionForm } from "./_components/new-subscription-form";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  return {
    ...metadata,
    title: "Pictures Writers | Conferma Sottoscrizione",
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

const ConfirmSubscriptionPage = () => {
  return <NewSubscriptionForm />;
};

export default ConfirmSubscriptionPage;
