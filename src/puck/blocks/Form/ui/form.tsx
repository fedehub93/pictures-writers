"use client";

import type { HydratedFormProps } from "@/puck/fields/form";
import { FormRunner } from "@/modules/forms/builder/runner/form-runner";
import { submitForm } from "@/actions/submit-form";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";

export const FormBlockUi = ({
  form,
  styleVars,
}: {
  form?: HydratedFormProps;
  styleVars: Record<string, string>;
}) => {
  if (!form || !form.content)
    return (
      <div className="flex items-center justify-center size-full">
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
    <div className="puck-dim" style={styleVars}>
      <FormRunner
        id={form.id}
        onSubmitHandler={onSubmit}
        gtmEventName={form.gtmEventName}
        content={form.content}
      />
    </div>
  );
};
