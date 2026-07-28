import slugify from "slugify";

export const generateSlug = (value: string) => {
  return slugify(value, {
    replacement: "_",
    remove: /[*+~.()'"!:@]/g,
    lower: true,
  });
};
