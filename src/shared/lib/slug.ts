import slugify from "slugify";

export const generateSlug = (value: string) => {
  return slugify(value, {
    replacement: "-",
    remove: /[*+~.()'"!:@?]/g,
    lower: true,
  });
};
