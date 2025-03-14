"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { removeSubscription } from "@/actions/remove-subscription";

export const RemoveSubscriptionForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!id) {
      setError("Missing id!");
      return;
    }

    removeSubscription(id)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        setError("Something went wrong!");
      });
  }, [id, success, error]);

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
              Riprova o effetua una richiesta tramite
              <strong>support@pitcuterwriters.com</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-gray-300 xl:text-7xl">
              Grazie
            </h2>
            <h3 className="text-lg font-extrabold uppercase text-heading xl:text-xl">
              La tua sottoscrizione è stata annullata.
            </h3>
          </>
        )}
        <Link href="/" className="text-primary-public!">
          Torna alla home
        </Link>
      </div>
    </section>
  );
};
