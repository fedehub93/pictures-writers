import { Metadata } from "next";
import * as z from "zod";
import { Clock } from "lucide-react";

import { ContactForm } from "./_components/contact-form";
import { getHeadMetadata } from "../../_components/seo/head-metadata";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  email: z
    .string()
    .min(1, {
      message: "Name is required",
    })
    .email("Email is invalid"),
  subject: z.string().min(1, {
    message: "Subject is required",
  }),
  message: z.string().min(1, { message: "Message is required" }),
});

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  return {
    ...metadata,
    title: "Contatti: Pictures Writers",
    description:
      "Sei un aspirante sceneggiatore e hai delle domande a cui non trovi risopsta? Contattaci e ti risponderemo il prima possibile.",
  };
}

const ContactPage = (): JSX.Element => {
  const contactOptions = [
    {
      label: "Orario di lavoro",
      Icon: Clock,
      descriptions: ["Cercheremo di risponderti prima possibile!"],
    },
  ];

  return (
    <section className="bg-indigo-100/40 px-4 pb-20 pt-20 lg:px-6">
      <div className="mx-auto  flex max-w-6xl flex-col items-center">
        <div className="mb-20 text-center">
          <h1 className="mb-4 text-3xl font-bold">Teniamoci in contatto</h1>
          <p className="text-md max-w-4xl px-8 leading-6 text-neutral-500">
            Per avere più informazioni riguardo i nostri servizi. Manda pure un
            messaggio e cercheremoupp di rispondere nel più breve tempo
            possibile. Non esitare!
          </p>
        </div>
        <div className="mx-auto flex w-full max-w-5xl flex-col flex-nowrap items-center justify-center gap-x-8 sm:flex-row sm:items-start">
          <div className="w-35rem mb-20 flex flex-col items-center  justify-between gap-y-8 sm:w-auto sm:gap-y-12">
            {contactOptions.map((option) => (
              <div
                key={option.label}
                className="gap-y grid w-11/12 grid-cols-[max-content_1fr] items-center justify-items-center gap-x-12 text-center sm:justify-items-start gap-y-2 sm:gap-y-4 sm:text-left"
              >
                <option.Icon className="h-6 w-6 col-start-1 col-end-3 sm:col-start-1 sm:col-end-auto" />
                <span className="col-start-1 col-end-3 text-base sm:col-start-2">
                  {option.label}
                </span>
                <div className="col-start-1 col-end-3 sm:col-start-2">
                  {option.descriptions.map((description) => (
                    <p key={description} className="text-sm text-neutral-500">
                      {description}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
