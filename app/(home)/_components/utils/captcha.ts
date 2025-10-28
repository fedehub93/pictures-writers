export const getCaptchaToken = async (action: string) => {
  return new Promise<string | null>((resolve) => {
    grecaptcha.ready(async () => {
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (!siteKey) {
        resolve(null);
        return;
      }

      const token = await grecaptcha.execute(siteKey, {
        action,
      });
      resolve(token);
    });
  });
};
