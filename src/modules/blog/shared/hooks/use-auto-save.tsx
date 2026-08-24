import { useDebounceCallback } from "usehooks-ts";
import { UseFormReturn, FieldValues } from "react-hook-form";

export function useAutoSave<T extends FieldValues>(
  form: UseFormReturn<T>,
  saveAction: (dirtyData: Partial<T>) => void,
) {
  const performSave = () => {
    const { dirtyFields } = form.formState;
    if (Object.keys(dirtyFields).length === 0) return;

    const currentValues = form.getValues();
    const dirtyData = Object.keys(dirtyFields).reduce((acc, key) => {
      acc[key as keyof T] = currentValues[key as keyof T];
      return acc;
    }, {} as Partial<T>);

    // Passa SOLO i campi modificati alla callback
    saveAction(dirtyData);
  };

  return useDebounceCallback(performSave, 1000);
}
