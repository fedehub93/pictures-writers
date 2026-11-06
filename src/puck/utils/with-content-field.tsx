import type { ReactNode } from "react";

import type { Field } from "@puckeditor/core";

import { withAccordionField } from "./with-accordion-field";

export type ContentFieldRenderProps<T extends object> = {
  /** Current value of the nested content object. */
  value: Partial<T>;
  /** Update one key without touching the rest of the content object. */
  update: <K extends keyof T>(key: K, value: T[K] | undefined) => void;
  /** Remove one key, so the control falls back to its default. */
  reset: (key: keyof T) => void;
};

/**
 * Shared convention for the nested content section of a Site region block.
 *
 * Each block groups the props of one section in a nested object, and this
 * wrapper turns that object into the same accordion section, with the same icon
 * and the same update helpers as the shared style fields. Controls inside the
 * section keep using `PropHeader`, so the reset affordance behaves the same as
 * in Dimension, Decoration and Typography.
 */
export function withContentField<T extends object>({
  label,
  icon,
  render,
}: {
  label: string;
  icon: ReactNode;
  render: (props: ContentFieldRenderProps<T>) => ReactNode;
}): Field<T | undefined> {
  return withAccordionField(
    label,
    icon,
    ({ value, onChange }) => {
      const state = (value ?? {}) as Partial<T>;

      const replace = (next: Partial<T>) => onChange(next);

      const update = <K extends keyof T>(
        key: K,
        nextValue: T[K] | undefined,
      ) => {
        replace({ ...state, [key]: nextValue });
      };

      const reset = (key: keyof T) => {
        const next = { ...state };
        delete next[key];
        replace(next);
      };

      return render({ value: state, update, reset });
    },
    true,
  );
}
