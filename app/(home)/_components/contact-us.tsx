"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Globe, Loader, Loader2, Mail } from "lucide-react";
import Link from "next/link";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

const ContactUs = (): JSX.Element => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <section className="px-4 py-20 lg:px-6">
      <div className="mx-auto max-w-lg md:max-w-screen-md lg:max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold">Contattaci</h2>
        <p className="mx-auto mb-12 max-w-lg text-center ">
          Hai domande o desideri ricevere ulteriori informazioni? Siamo qui per
          ascoltarti, rispondere alle tue richieste e fornirti tutto il supporto
          di cui hai bisogno nella tua avventura nella sceneggiatura
          cinematografica.
        </p>
        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-20">
          <Form {...form}>
            <form
              className="mb-12 lg:mb-0"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-auto min-w-60">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            disabled={isSubmitting}
                            placeholder="Mario Rossi"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-auto min-w-60">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            disabled={isSubmitting}
                            placeholder="mario.rossi@gmail.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          placeholder="Info"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isSubmitting}
                          placeholder="I want to ask you..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button type="submit" className="bg-primary-public">Invia messaggio</Button>
              )}
            </form>
          </Form>
          <ul className=" last:mb-0">
            <li>
              <a
                className="mb-5 flex items-start justify-start gap-1"
                href="mailto:support@pictureswriters.com"
              >
                <Mail className="h-5 w-5" />
                <span>: support@pictureswriters.com</span>
              </a>
            </li>
            <li>
              <Link
                href="/"
                className="mb-5 flex items-start justify-start gap-1"
              >
                <Globe className="h-5 w-5" />
                <span>: https://pictureswriters.com</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
