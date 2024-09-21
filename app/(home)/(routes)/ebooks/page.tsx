import Link from "next/link";
// import React, { useEffect, useState } from "react";

const DownloadEbook = ({
  searchParams,
}: {
  searchParams?: {
    download_url?: string;
  };
}) => {
  // const [downloadUrl, setDownloadUrl] = useState("");

  // useEffect(() => {
  //   if (typeof window !== `undefined`) {
  //     const queryString = window.location.search;
  //     const urlParams = new URLSearchParams(queryString);
  //     const mailingList = urlParams.get("mailingList");
  //     const token = urlParams.get("token");

  //     const apiUrl =
  //       process.env.NODE_ENV === "production"
  //         ? `${process.env.GATSBY_STRAPI_BACKEND_URL}/api`
  //         : `${process.env.GATSBY_STRAPI_BACKEND_URL_TEST}/api`;
  //     setDownloadUrl(
  //       `${apiUrl}/ebooks/download?mailingList=${mailingList}&token=${token}`
  //     );
  //   }
  // }, []);

  const s = searchParams?.download_url || "";
  return (
    <section className="h-screen w-full items-center">
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
            href={s}
            className="mr-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-all duration-500 hover:-translate-y-1 hover:shadow-xl focus:outline-none lg:px-5 lg:py-2.5"
            download="screenplay-101.pdf"
          >
            Download
          </a>

          <Link className="!text-primary" href="/">
            Torna alla home
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DownloadEbook;
