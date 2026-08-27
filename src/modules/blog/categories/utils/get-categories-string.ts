export const getCategoriesString = (
  categories: {
    title: string | null;
  }[],
) => {
  return categories.map((c) => `${c.title}`).join(", ");
};
