"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

const SidebarEbook = (): JSX.Element => {
  const [email, setEmail] = useState("");
  // const { isLoading, status, setStatus, subscribeEbook } = useDownloadEbook();
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // subscribeEbook(email);
    setEmail("");
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setEmail(value);
  };
  return (
    <div className="w-full bg-white px-6 py-8 shadow-md flex flex-col">
      <h3 className="mb-4 text-sm font-extrabold uppercase">Ebook gratuito</h3>
      <Image
        src="/ebook.png"
        alt="eBook gratuito sull'introduzione alla sceneggiatura cinematografica"
        width={2000}
        height={2000}
      />
      <div className="mb-4">
        Non sai da dove iniziare?
        <br /> Scarica{" "}
        <span className="rounded-md bg-primary-public p-1 text-secondary">
          l&apos;ebook gratuito
        </span>{" "}
        su: <br />
        <span className="mt-2 rounded-md bg-indigo-100 p-1 font-bold text-primary-public block italic">
          Introduzione alla sceneggiatura cinematografica
        </span>
      </div>
      <form className="relative" onSubmit={handleSubmit}>
        <Input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="Inserisci la tua email"
          value={email}
          onChange={handleEmailChange}
        />
        <div className="mt-4 mb-2">
          * Confermando il modulo accetti la&nbsp;
          <Link
            className="text-primary-public"
            href="https://www.iubenda.com/privacy-policy/49078580"
          >
            Privacy Policy
          </Link>{" "}
          di Pictures Writers.
        </div>
        {false ? (
          <div role="status" className="absolute right-1 top-2 mr-2">
            <Loader2 className="animate" />
          </div>
        ) : (
          <Button type="submit" className="bounce mt-4 w-full text-xl bg-primary-public">
            Download eBook
          </Button>
        )}
        {/* <Alert
          status={status}
          setStatus={setStatus}
          errorMessage="Qualcosa è andato storto. Prego riprova oppure contatta il nostro
          supporto alla mail support@pictureswriters.com."
          successMessage="Ti è stata inviata una mail dove potrai effettuare il download
          dell'eBook. Grazie per esserti unito a noi."
        /> */}
      </form>
    </div>
  );
};

export default SidebarEbook;
