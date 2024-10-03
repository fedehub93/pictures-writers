"use client";

import { useState, useEffect } from "react";
import { getLocalStorage, setLocalStorage } from "@/lib/storage-helper";
import Link from "next/link";

// CookieBanner component that displays a banner for cookie consent.
export default function CookieBanner() {
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Retrieve cookie consent status from local storage on component mount
  useEffect(() => {
    const storedCookieConsent = getLocalStorage("cookie_consent", null);

    setCookieConsent(storedCookieConsent);
    setIsLoading(false);
  }, []);

  // Update local storage and Google Analytics consent status when cookieConsent changes
  useEffect(() => {
    if (cookieConsent !== null) {
      setLocalStorage("cookie_consent", cookieConsent);
    }

    const newValue = cookieConsent ? "granted" : "denied";

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: newValue,
      });
    }
  }, [cookieConsent]);

  // Do not render the banner if loading or consent is already given
  if (isLoading || cookieConsent !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-0 w-full bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <span className="text-sm">
          Questo sito utilizza cookie per migliorare l&apos;esperienza utente.
          Per saperne di più, consulta la nostra{" "}
          <Link
            href="https://www.iubenda.com/privacy-policy/49078580/cookie-policy"
            className="underline"
          >
            privacy policy
          </Link>
          .
        </span>

        <div className="flex space-x-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={() => setCookieConsent(true)}
          >
            Accetta
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={() => setCookieConsent(false)}
          >
            Declina
          </button>
        </div>
      </div>
    </div>
  );
}
