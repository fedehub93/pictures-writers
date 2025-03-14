"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as v from "valibot";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { BeatLoader } from "react-spinners";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ContactSchemaValibot } from "@/schemas";
import { contact } from "@/actions/contact";

export const ContactForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<v.InferInput<typeof ContactSchemaValibot>>({
    resolver: valibotResolver(ContactSchemaValibot),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const { isValid, isSubmitting } = form.formState;

  const onSubmit = async (
    values: v.InferInput<typeof ContactSchemaValibot>
  ) => {
    try {
      setError("");
      setSuccess("");

      startTransition(async () => {
        contact(values).then((data) => {
          setError(data.error);
          setSuccess(data.success);
        });
      });
    } catch (error) {
      setError(
        "Qualcosa è andato storto. Prego riprovare o contattare il supporto."
      );
    }
  };

  return (
    <Form {...form}>
      <form className="mb-12 lg:mb-0" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-8 mb-4">
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
        {error && <div className="p-4 mb-4 bg-destructive">{error}</div>}
        {success && (
          <div className="p-4 mb-4 bg-emerald-100 shadow-2xs rounded-md">
            {success}
          </div>
        )}
        {isPending ? (
          <BeatLoader />
        ) : (
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-primary-public"
          >
            Invia messaggio
          </Button>
        )}
      </form>
    </Form>
  );
};
