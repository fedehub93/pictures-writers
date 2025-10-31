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

    return forms;
  } catch (error) {
    return [];
  }
};

export type GetFormsByFiltersReturn = Awaited<
  ReturnType<typeof getFormsByFilters>
>[number];

/**
 * GetFormSubmissionsByFilter
 */
type GetFormSubmissionsByFiltersParams = {
  where: Prisma.Args<typeof db.formSubmission, "findMany">["where"];
};

export const getFormSubmissionsByFilters = async ({
  where,
}: GetFormSubmissionsByFiltersParams) => {
  try {
    const forms = await db.formSubmission.findMany({
      where,
      select: {
        id: true,
        email: true,
        form: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    return forms;
  } catch (error) {
    return [];
  }
};

export type GetFormSubmissionsByFiltersReturn = Awaited<
  ReturnType<typeof getFormSubmissionsByFilters>
>[number];

/**
 * GetFormSubmissionById
 */
export const getFormSubmissionById = async (id: string) => {
  try {
    const submission = await db.formSubmission.findFirst({
      select: {
        id: true,
        email: true,
        form: {
          select: {
            name: true,
            fields: true,
          },
        },
        data: true,
        createdAt: true,
      },
      where: {
        id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return submission;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export type GetFormSubmissionByIdReturn = Awaited<
  ReturnType<typeof getFormSubmissionById>
>;
