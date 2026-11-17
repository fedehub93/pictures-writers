"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { CONTACT_EMAIL } from "@/constants";

import { removeSubscription } from "@/actions/remove-subscription";

export const RemoveSubscriptionForm = () => {
  const [result, setResult] = useState<{ error?: string } | null>(null);
  const startedRef = useRef<string | null>(null);
  const searchParams = useSearchParams();

  const id = searchParams.get("id");

  useEffect(() => {
    // Run each id's one-shot confirmation once even under StrictMode's double
    // effect invocation; the result is applied from the promise callback so
    // the effect itself never sets state synchronously.
    if (!id || startedRef.current === id) return;
    startedRef.current = id;

    removeSubscription(id)
      .then((data) => {
        setResult({ error: data.error });
      })
      .catch(() => {
        setResult({ error: "Something went wrong!" });
      });
  }, [id]);

  const error = id ? result?.error : "Missing id!";

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
              <strong>{CONTACT_EMAIL}</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-primary xl:text-7xl">
              Grazie
            </h2>
            <h3 className="text-xl font-extrabold text-heading xl:text-2xl">
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
