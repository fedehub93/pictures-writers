"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const FORM_URL = "/api/ebooks-subscribe";

export const HeroSection = (): JSX.Element => {
  const [status, setStatus] = useState<"SUCCESS" | "ERROR" | null>(null);
  const [email, setEmail] = useState("");
  // const [isPrivacyAccepted, setIsPrivacyAccepted] = useState(false);
  // const [isErrorVisible, setIsErrorVisible] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // setIsErrorVisible(true);
    // if (!email || !isPrivacyAccepted) return;

    const data = { email };

    const headers = { "content-type": "application/json" };

    const options = {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    };
    // try {
    //   setIsLoading(true);
    //   await delay(1000);
    //   const response = await fetch(FORM_URL, options);
    //   const json = await response.json();
    //   if (json.status === 'SUCCESS') {
    //     setEmail('');
    //     setStatus('SUCCESS');
    //     return;
    //   }
    //   setStatus('ERROR');
    // } catch (error) {
    //   setStatus('ERROR');
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setEmail(value);
  };

  return (
    <section className="w-full bg-indigo-100/40 px-4 lg:px-6 py-24">
      <div className="mx-auto max-w-lg text-center md:max-w-screen-md lg:max-w-6xl lg:text-left">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-y-10">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl xl:text-6xl">
              Vuoi diventare <br />
              <span className="text-primary-public">uno sceneggiatore?</span>
            </h1>
            <p>
              <span className="evidence">
                La nostra missione è alimentare la tua fiamma creativa
              </span>
              , fornendoti l&apos;ispirazione, l&apos;istruzione e la comunità
              di supporto di cui hai bisogno per diventare uno sceneggiatore di
              successo.
            </p>
            <p>
              Pronto a dare vita alle tue idee sul grande schermo?
              <br />
              <span className="font-bold text-primary-public">
                Scarica il nostro eBook gratuito:
              </span>
              &nbsp;
              <span className="font-bold italic text-black">
                Introduzione alla sceneggiatura cinematografica
              </span>
              , e inizia a scrivere le tue storie di successo.
            </p>
            <form className="relative" onSubmit={handleSubmit}>
              <div className="mb-4">
                * Confermando il modulo accetti la&nbsp;
                <Link
                  className="text-primary-public"
                  href="https://www.iubenda.com/privacy-policy/49078580"
                >
                  Privacy Policy
                </Link>{" "}
                di Pictures Writers.
              </div>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="peer block min-h-[auto] w-full rounded-lg border-2 border-gray-200 bg-ghostWhite2 bg-transparent px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary-public"
                  placeholder="Inserisci la tua email"
                  value={email}
                  onChange={handleEmailChange}
                />
                {isLoading ? (
                  <div role="status" className="absolute right-1 top-2 mr-2">
                    <Loader2 className="animate" />
                  </div>
                ) : (
                  <Button
                    type="submit"
                    className="absolute right-1 top-1 mr-2 bg-primary-public"
                  >
                    Download eBook
                  </Button>
                )}
              </div>
            </form>
            {/* <Alert
              status={status}
              setStatus={setStatus}
              errorMessage="Qualcosa è andato storto. Prego riprova oppure contatta il
                nostro supporto alla mail support@pictureswriters.com."
              successMessage="Ti è stata inviata una mail dove potrai effettuare il download
                dell'eBook. Grazie per esserti unito a noi."
            /> */}
          </div>
          <div className="mb-12 rounded-lg lg:mb-0 aspect-square relative">
            <Image
              alt="jumbotron"
              fill
              className="object-cover"
              src="/story-book.png"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
