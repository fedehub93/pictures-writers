"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { newSubscription } from "@/actions/new-subscription";

export const NewSubscriptionForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError("Missing token!");
      return;
    }

    newSubscription(token)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        setError("Something went wrong!");
      });
  }, [token, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <section className="w-full items-center">
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-8 px-5 py-24 text-center">
        {error ? (
          <>
            <h2 className="text-3xl font-extrabold text-gray-300 xl:text-7xl">
              Qualcosa è andato storto
            </h2>
            <h3 className="text-lg font-extrabold uppercase text-heading xl:text-xl">
              Ci scusiamo per il disagio
            </h3>
            <p>
              È possibile che dalla sottoscrizione alla conferma tramite email
              sia passato del tempo e la tua richiesta sia scaduta.
              <br />
              <br />
              Rieffettuare la sottoscrizione o effetuare una richiesta tramite{" "}
              <strong>support@pitcuterwriters.com</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-gray-300 xl:text-7xl">
              Grazie
            </h2>
            <h3 className="text-lg font-extrabold uppercase text-heading xl:text-xl">
              La tua sottoscrizione è stata confermata.
            </h3>
            <p>
              Sei stato aggiunto alla nostra mailing list.
              <br /> Ci sentiamo presto.
              <br />
              <br /> Ricordati che puoi chiudere la sottoscrizione attraverso
              ogni mail che riceverai.
            </p>
          </>
        )}
        <Link href="/" className="text-primary-public!">
          Torna alla home
        </Link>
      </div>
    </section>
  );
};
