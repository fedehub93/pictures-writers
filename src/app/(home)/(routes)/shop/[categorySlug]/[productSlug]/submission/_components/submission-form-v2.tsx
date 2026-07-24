"use client";

import { FormRunner } from "@/modules/forms/builder/runner/form-runner";
import { FormRootInstance } from "@/modules/forms/builder/types/core";

import { submitProductForm } from "@/actions/submit-product-form";

import { getCaptchaToken } from "@/app/(home)/_components/utils/captcha";

export const SubmissionFormV2 = ({
  rootId,
  content,
  gtmEventName,
}: {
  rootId: string;
  content: FormRootInstance;
  gtmEventName: string | null;
}) => {
  const onSubmit = async (values: Record<string, any>) => {
    const recaptchaToken = await getCaptchaToken("submit_product_form");

    if (!recaptchaToken) {
      return {
        success: false,
        message: "Security verification failed. Please try again.",
      };
    }

    const data = await submitProductForm(rootId, values, recaptchaToken);

    if (!data.success) {
      return { success: false, message: data.message };
    }

    return { success: true, message: data.message };
  };

  return (
    <FormRunner
      id={rootId!}
      onSubmitHandler={onSubmit}
      content={content!}
      gtmEventName={gtmEventName}
    />
  );
};
