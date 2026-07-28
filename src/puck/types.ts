type FieldInputType = "text" | "unit";

export type FieldDef<T> = {
  key: keyof T;
  label: string;
  placeholder?: string;
  type?: FieldInputType;
};
