import React from "react";
import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import Editor from "@/app/(admin)/_components/editor";

interface GenericEditorProps<T extends FieldValues> {
  id: string;
  control: Control<T>;
  name: Path<T>;
  label: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const GenericEditor = <T extends FieldValues>({
  id,
  control,
  name,
  label,
  containerProps,
  ...inputProps
}: GenericEditorProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Editor
              key={id}
              {...field}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
              }}
            >
              <Editor.Toolbar showEmbedButton={false} padding="xs" />
              <Editor.Input onHandleIsFocused={() => {}} />
              <Editor.Counter value={field.value} />
            </Editor>
          </FormControl>
        </FormItem>
      )}
    />
  );
};
