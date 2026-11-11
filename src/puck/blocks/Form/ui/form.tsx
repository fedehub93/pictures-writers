"use client";

import type { HydratedFormProps } from "@/puck/fields/form";
import type { BlockDragRef } from "@/puck/types";
import { FormRunner } from "@/modules/forms/builder/runner/form-runner";
import { submitForm } from "@/actions/submit-form";
import { cn } from "@/shared/lib/utils";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";

export const FormBlockUi = ({
  form,
  styleVars,
  layoutClassName,
  dragRef,
}: {
  form?: HydratedFormProps;
  styleVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: Puck's selection ref, attached to the block root. */
  dragRef?: BlockDragRef;
}) => {
  if (!form || !form.content)
    return (
      // The placeholder is the block root in this state too: without the ref an
      // empty Form could not be selected in the canvas. It deliberately keeps
      // its own `size-full` box instead of `puck-dim`: the message fills the
      // area it is dropped in, and the authored dimension only describes the
      // real form.
      <div
        ref={dragRef}
        className={cn(
          "flex items-center justify-center size-full puck-block-root",
          layoutClassName,
        )}
        style={styleVars}
      >
        Select a valid form!
      </div>
    );

  const onSubmit = async (values: Record<string, any>) => {
    const recaptchaToken = await getCaptchaToken("submit_form");

    if (!recaptchaToken) {
      return {
        success: false,
        message: "Security verification failed. Please try again.",
      };
    }

    const data = await submitForm(form.id, values, recaptchaToken);

    if (!data.success) {
      return { success: false, message: data.message };
    }

    return { success: true, message: data.message };
  };

  return (
    <div
      ref={dragRef}
      className={cn("puck-dim puck-block-root", layoutClassName)}
      style={styleVars}
    >
      <FormRunner
        id={form.id}
        onSubmitHandler={onSubmit}
        gtmEventName={form.gtmEventName}
        content={form.content}
      />
    </div>
  );
};
