"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Format, Genre } from "@prisma/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  firstName: z.string().min(1, {
    message: "Name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
  email: z
    .string()
    .min(1, {
      message: "Email is required",
    })
    .email("Email is invalid"),
  title: z.string().min(1, {
    message: "Title is required",
  }),
  formatId: z.string(),
  genreId: z.string(),
  pageCount: z.number().optional(),
  file: z
    .unknown()
    .transform((value) => {
      return value as FileList;
    })
    .refine((files) => files instanceof FileList && files.length === 1, {
      message: "Devi caricare un solo file!",
    })
    .refine(
      (files) => files instanceof FileList && files[0]?.size <= 3 * 1024 * 1024, // massimo 3MB
      {
        message: "Il file deve essere inferiore a 3MB",
      }
    )
    .refine(
      (files) =>
        files instanceof FileList && files[0]?.type === "application/pdf",
      {
        message: "Il file deve essere un PDF",
      }
    ),
});

interface FirstImpressionFormProps {
  formats: Format[];
  genres: Genre[];
}

const FirstImpressionForm = ({
  formats,
  genres,
}: FirstImpressionFormProps): JSX.Element => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      pageCount: 0,
    },
  });

  const fileRef = form.register("file");

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (values.file === null || !values.file[0]) return;
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("email", values.email);
      formData.append(
        "pageCount",
        values.pageCount ? values.pageCount?.toString() : "0"
      );
      formData.append("formatId", values.formatId);
      formData.append("genreId", values.genreId);
      formData.append("file", values.file[0]);

      const res = await axios.post("/api/coverage/impressions", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data) {
        router.push("/feedback-gratuito-sceneggiatura/success");
      }
    } catch (error) {
      console.log(error);
    } finally {
      router.refresh();
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-8"
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Mario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cognome *</FormLabel>
                <FormControl>
                  <Input placeholder="Rossi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="mario.rossi@gmail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titolo sceneggiatura *</FormLabel>
                <FormControl>
                  <Input placeholder="Il petroliere" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="formatId"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormLabel>Formato *</FormLabel>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un formato..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {formats.map((format) => {
                      return (
                        <SelectItem
                          key={format.title}
                          value={format.id}
                          className="w-full flex items-center justify-between"
                        >
                          {format.title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="genreId"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormLabel>Genere *</FormLabel>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona un genere..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genres.map((genre) => {
                      return (
                        <SelectItem
                          key={genre.title}
                          value={genre.id}
                          className="w-full flex items-center justify-between"
                        >
                          {genre.title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      placeholder="Sceneggiatura"
                      {...fileRef}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <div className="mb-4">
            * Confermando il modulo accetti la&nbsp;
            <Link
              className="text-primary"
              href="https://www.iubenda.com/privacy-policy/49078580"
            >
              Privacy Policy
            </Link>{" "}
            di Pictures Writers.
          </div>
          {isLoading && <Loader2 />}
          <div className="flex items-center gap-x-8 mt-4">
            <Button type="submit" disabled={isLoading}>
              Invia
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default FirstImpressionForm;
