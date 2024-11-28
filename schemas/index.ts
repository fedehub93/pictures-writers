import { EbookType } from "@/types";
import * as v from "valibot";

export const SubscribeSchemaValibot = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted.")
  ),
});

export const FreeEbookSchemaValibot = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted.")
  ),
  rootId: v.string(),
  format: v.enum(EbookType),
});

export const ContactSchemaValibot = v.object({
  name: v.pipe(v.string(), v.nonEmpty("Name is required")),
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted.")
  ),
  subject: v.pipe(v.string(), v.nonEmpty("Subject is required")),
  message: v.pipe(v.string(), v.nonEmpty("Message is required")),
});

export const FirstImpressionSchemaValibot = v.object({
  firstName: v.pipe(v.string(), v.nonEmpty("Il nome è obbligatorio!")),
  lastName: v.pipe(v.string(), v.nonEmpty("Il cognome è obbligatorio!")),
  email: v.pipe(
    v.string(),
    v.nonEmpty("Inserisci una mail!"),
    v.email("Inserisci una mail valida!")
  ),
  title: v.pipe(v.string(), v.nonEmpty("Il titolo è obbligatorio!")),
  formatId: v.string("Seleziona un formato!"),
  genreId: v.string("Seleziona un genere!"),
  pageCount: v.number(),
  file:
    typeof FileList !== "undefined"
      ? v.pipe(
          v.instance(FileList),
          v.check((files) => files.length === 1, "Seleziona un solo file!"),
          v.check(
            (files) => files[0].size <= 3 * 1024 * 1024,
            "Il file deve essere inferiore a 3 MB"
          ),
          v.check(
            (files) => files[0].type === "application/pdf",
            "Selezionare un file pdf!"
          )
        )
      : v.any(),
});
