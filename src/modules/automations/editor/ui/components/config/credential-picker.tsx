"use client";

import { useQuery } from "@tanstack/react-query";

import { MAX_PAGE_SIZE } from "@/modules/automations/constants";
import { useTRPC } from "@/trpc/client";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

/** Radix Select cannot use an empty string value; this is the "none" sentinel. */
const NO_CREDENTIAL = "__none__";

export interface CredentialPickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
}

/**
 * Reusable picker that attaches an encrypted Credential to a node by id. Only
 * the id is stored on the node; the secret never reaches the client.
 */
export function CredentialPicker({
  id,
  value,
  onChange,
  label = "Credential",
  description,
}: CredentialPickerProps) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.credentials.getMany.queryOptions({
      page: 1,
      pageSize: MAX_PAGE_SIZE,
    }),
  );

  const credentials = data?.items ?? [];

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value || NO_CREDENTIAL}
        onValueChange={(next) => onChange(next === NO_CREDENTIAL ? "" : next)}
        disabled={isLoading}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue
            placeholder={
              isLoading ? "Loading credentials..." : "Select a credential"
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_CREDENTIAL}>None</SelectItem>
          {credentials.map((credential) => (
            <SelectItem key={credential.id} value={credential.id}>
              {credential.name} ({credential.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
