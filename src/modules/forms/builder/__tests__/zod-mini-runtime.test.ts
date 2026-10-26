import { describe, expect, expectTypeOf, it } from "vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import * as z from "zod/mini";

import { ContactSchema, FreeDigitalDownloadSchema } from "@/schemas";

import { buildSchema as buildTextFieldSchema } from "../ui/fields/text-field/schemas";
import { buildSchema as buildTextareaFieldSchema } from "../ui/fields/textarea-field/schemas";
import { buildSchema as buildSelectFieldSchema } from "../ui/fields/select-field/schemas";
import { buildSchema as buildCheckboxFieldSchema } from "../ui/fields/checkbox-field/schemas";
import { buildSchema as buildUploadFieldSchema } from "../ui/fields/upload-field/schemas";
import { TextInputEnum } from "../types/properties";

const fieldProperties = {
  name: "field",
  label: "Field",
  helperText: "",
  placeholder: "",
  validation: { required: true },
};

async function resolve<T extends z.ZodMiniType>(
  schema: T,
  values: Record<string, unknown>,
) {
  const resolver = zodResolver<
    Record<string, unknown>,
    undefined,
    Record<string, unknown>
  >(schema as never);

  return resolver(values, undefined, {
    criteriaMode: "firstError",
    fields: {},
    shouldUseNativeValidation: false,
  });
}

describe("Zod Mini form builder runtime schemas", () => {
  it("validates required text, email and length rules", async () => {
    const text = buildTextFieldSchema({
      ...fieldProperties,
      inputType: TextInputEnum.Text,
      validation: { required: true, minLength: 3, maxLength: 6 },
    });

    expect(await resolve(z.object({ field: text }), { field: "" })).toMatchObject(
      {
        errors: { field: { message: "Field is required!" } },
      },
    );
    expect(
      await resolve(z.object({ field: text }), { field: "ab" }),
    ).toMatchObject({
      errors: {
        field: { message: "Minimum characters for this field are 3" },
      },
    });
    expect(
      await resolve(z.object({ field: text }), { field: "abcdefg" }),
    ).toMatchObject({
      errors: {
        field: { message: "Maximum characters for this field are 6" },
      },
    });
    expect(
      await resolve(z.object({ field: text }), { field: "abc" }),
    ).toEqual({ errors: {}, values: { field: "abc" } });
  });

  it("validates email fields", async () => {
    const email = buildTextFieldSchema({
      ...fieldProperties,
      inputType: TextInputEnum.Email,
      validation: { required: true },
    });

    expect(
      await resolve(z.object({ field: email }), { field: "not-an-email" }),
    ).toMatchObject({
      errors: { field: { message: "Invalid email address" } },
    });
  });

  it("validates required textareas, selects and uploads", async () => {
    const textarea = buildTextareaFieldSchema({
      ...fieldProperties,
      validation: { required: true },
    });
    const select = buildSelectFieldSchema({
      ...fieldProperties,
      options: ["a", "b"],
      validation: { required: true },
    });
    const upload = buildUploadFieldSchema({
      ...fieldProperties,
      files: [],
      validation: { required: true },
    });

    const schema = z.object({ textarea, select, upload });
    const result = await resolve(schema, {
      textarea: "",
      select: "",
      upload: [],
    });

    expect(result).toMatchObject({
      errors: {
        upload: { message: "Field is required!" },
        select: { message: "Field is required!" },
        textarea: { message: "Field is required!" },
      },
    });
  });

  it("validates required consent checkboxes", async () => {
    const checkbox = buildCheckboxFieldSchema({
      ...fieldProperties,
      description: {},
      validation: { required: true },
    });

    const schema = z.object({ checkbox });
    expect(await resolve(schema, { checkbox: false })).toMatchObject({
      errors: { checkbox: { message: "Field is required!" } },
    });
    expect(await resolve(schema, { checkbox: true })).toEqual({
      errors: {},
      values: { checkbox: true },
    });
  });
});

describe("Zod Mini resolver compatibility with public form schemas", () => {
  it("infers react-hook-form resolver types from Mini schemas", () => {
    const schema = z.object({ field: z.string() });

    expectTypeOf(zodResolver(schema)).toEqualTypeOf<
      Resolver<{ field: string }, unknown, { field: string }>
    >();
  });

  it("maps contact schema issues to react-hook-form field errors", async () => {
    const result = await resolve(ContactSchema, {
      name: "",
      email: "",
      subject: "",
      message: "",
    });

    expect(result).toMatchObject({
      errors: {
        name: { message: "Name is required" },
        email: { message: "Please enter your email." },
        subject: { message: "Subject is required" },
        message: { message: "Message is required" },
      },
    });
  });

  it("maps free download consent issues to react-hook-form field errors", async () => {
    const result = await resolve(FreeDigitalDownloadSchema, {
      email: "ada@example.com",
      rootId: "product-root-1",
      privacyConsent: false,
    });

    expect(result).toMatchObject({
      errors: {
        privacyConsent: {
          message: "You must accept the privacy policy.",
        },
      },
    });
  });
});
