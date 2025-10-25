import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * GetFormsByFilter
 */
type GetFormsByFiltersParams = {
  where: Prisma.Args<typeof db.form, "findMany">["where"];
};

export const getFormsByFilters = async ({ where }: GetFormsByFiltersParams) => {
  try {
    const forms = await db.form.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
    });
    console.log(forms);

    return forms;
  } catch (error) {
    return [];
  }
};

export type GetFormsByFiltersReturn = Awaited<
  ReturnType<typeof getFormsByFilters>
>[number];
