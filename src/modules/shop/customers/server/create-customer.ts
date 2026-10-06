import "server-only";

import type { Customer } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

export interface CreateOrUpdateCustomerInput {
  email: string;
  name?: string;
  phone?: string;
  notes?: string;
}

const toNullable = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Create-or-update used by the `CREATE_CUSTOMER` automation node. Email is the
 * natural key: a repeat submission from the same address updates the existing
 * Customer instead of failing on the unique constraint. Only the fields the
 * caller actually supplied are written, so a sparse payload never wipes data an
 * admin entered.
 */
export async function createOrUpdateCustomerByEmail(
  input: CreateOrUpdateCustomerInput,
): Promise<Customer> {
  const email = input.email.trim().toLowerCase();

  const name = toNullable(input.name);
  const phone = toNullable(input.phone);
  const notes = toNullable(input.notes);

  const present = {
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(notes ? { notes } : {}),
  };

  return db.customer.upsert({
    where: { email },
    create: { email, ...present },
    update: present,
  });
}
