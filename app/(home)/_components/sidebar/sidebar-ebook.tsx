import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BeatLoader } from "react-spinners";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { db } from "@/lib/db";
import { getPublishedEbookBySlug } from "@/lib/ebook";

const SidebarEbook = async () => {
  // const [error, setError] = useState<string | undefined>("");
  // const [success, setSuccess] = useState<string | undefined>("");

  // const [isPending, startTransition] = useTransition();

  // const form = useForm<v.InferInput<typeof FreeEbookSchemaValibot>>({
  //   resolver: valibotResolver(FreeEbookSchemaValibot),
  //   defaultValues: {
  //     email: "",
  //     // ebookId: "e5ec60b7-bffd-412b-8383-72fcf74a5516",
  //     ebookId: "ccb34a74-8738-4fe3-8a47-e3659ca15c91",
  //     format: "pdf",
  //   },
  // });

  // const { isSubmitting, isValid } = form.formState;

  // const onSubmit = async (
  //   values: v.InferInput<typeof FreeEbookSchemaValibot>
  // ) => {
  //   try {
  //     setError("");
  //     setSuccess("");

  //     startTransition(async () => {
  //       subscribeFreeEbook(values).then((data) => {
  //         setError(data.error);
  //         setSuccess(data.success);
  //       });
  //     });
  //   } catch (error) {
  //     setError(
  //       "Qualcosa è andato storto. Prego riprovare o contattare il supporto."
  //     );
  //   }
  // };

  const ebook = await getPublishedEbookBySlug(
    "introduzione-alla-sceneggiatura"
  );

  if (!ebook) {
    return null;
  }

  return (
    <div className="relative w-full bg-white px-6 py-8 shadow-md flex flex-col gap-y-4">
      <h3 className="text-sm font-extrabold uppercase mb-2">Ebook gratuito</h3>
      <Link href={`/ebooks/${ebook.slug}`} className="group">
        <Image
          src={ebook.imageCover?.url!}
          alt="eBook gratuito sull'introduzione alla sceneggiatura cinematografica"
          width={200}
          height={400}
          sizes="(max-width: 1280px) 90vw, 20vw"
          className="mx-auto w-4/5 group-hover:scale-[1.02] group-hover:shadow-lg duration-700"
          quality={90}
        />
      </Link>
    </div>
  );
};

export default SidebarEbook;
