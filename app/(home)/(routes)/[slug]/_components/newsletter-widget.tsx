"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const NewsletterWidget = (): JSX.Element => {
  const [status, setStatus] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    try {
      event.preventDefault();

      if (!email) return;

      // setIsLoading(true);
      // await delay(1000);
      // const response = await fetch(FORM_URL, options);
      // const json = await response.json();
      // if (json.status === "SUCCESS") {
      //   setStatus("SUCCESS");
      //   return;
      // }
      // setStatus("ERROR");
    } catch (error) {
      setStatus("ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setEmail(value);
  };

  return (
    <div className="snippet newsletter">
      <h6 className="snippet__title">Pictures Writers Newsletter</h6>
      {status === "SUCCESS" && (
        <div className="newsletter__success">
          <p>
            Benvenuto a bordo, ti ringraziamo per esserti iscritto alla nostra
            newsletter.
          </p>
          <p>
            <strong>
              Ti abbiamo inviato una email per confermare la tua sottoscrizione.
            </strong>
          </p>
          <p>
            Promettiamo di non essere invadenti e vogliamo ricordarti che potrai
            annullare la sottoscrizione direttamente dalle email che riceverai.
          </p>
          <p>Grazie ancora per esserti unito a noi.</p>
        </div>
      )}
      {status === "ERROR" && (
        <div className="newsletter__error">
          <p>Ooops, qualcosa è andato storto...</p>
          <p>
            Per favore,{" "}
            <button type="button" onClick={() => setStatus(null)}>
              <u>riprova</u>
            </button>{" "}
            oppure contattaci scrivendo a{" "}
            <strong>support@pictureswriters.com</strong>.
          </p>
        </div>
      )}
      {status === null && (
        <>
          <div className="newsletter__box">
            Iscriviti alla nostra community di sceneggiatori e riceverai news
            settimanali direttamente sulla tua email:
            <br />
            <br />
            <ul className="list-disc pl-4">
              <li>Articoli più popolari e news sul settore.</li>
              <li>Nuovi eventi online di Pictures Writers.</li>
            </ul>
          </div>
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
          {isLoading ? (
            <Loader2 className="animate" />
          ) : (
            <form className="newsletter__form" onSubmit={handleSubmit}>
              <input
                aria-label="Email Newsletter"
                name="email"
                type="email"
                className="newsletter__form-email"
                placeholder="La tua email"
                autoComplete="off"
                value={email}
                onChange={handleEmailChange}
              />

              <button className="newsletter__form-button" type="submit">
                Iscriviti
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default NewsletterWidget;
