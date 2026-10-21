type Grecaptcha = {
  ready: (callback: () => void) => void;
  execute: (
    siteKey: string,
    options: { action: string },
  ) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const SCRIPT_ID = "recaptcha-v3";
const EXECUTE_TIMEOUT_MS = 10_000;

let recaptchaPromise: Promise<Grecaptcha> | null = null;

const loadRecaptcha = (siteKey: string): Promise<Grecaptcha> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("reCAPTCHA can only load in the browser"));
  }

  if (window.grecaptcha) {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaPromise) {
    return recaptchaPromise;
  }

  recaptchaPromise = new Promise<Grecaptcha>((resolve, reject) => {
    const existingScript = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.grecaptcha) {
        resolve(window.grecaptcha);
        return;
      }

      reject(new Error("reCAPTCHA loaded without the grecaptcha global"));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load reCAPTCHA")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load reCAPTCHA")),
      { once: true },
    );

    document.head.appendChild(script);
  }).catch((error) => {
    recaptchaPromise = null;
    document.getElementById(SCRIPT_ID)?.remove();
    throw error;
  });

  return recaptchaPromise;
};

const executeRecaptcha = (
  grecaptcha: Grecaptcha,
  siteKey: string,
  action: string,
): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("reCAPTCHA execution timed out")),
      EXECUTE_TIMEOUT_MS,
    );

    grecaptcha.ready(() => {
      grecaptcha
        .execute(siteKey, { action })
        .then((token) => {
          window.clearTimeout(timeout);
          resolve(token);
        })
        .catch((error) => {
          window.clearTimeout(timeout);
          reject(error);
        });
    });
  });

export const getCaptchaToken = async (action: string) => {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey || typeof window === "undefined") {
    return null;
  }

  try {
    const grecaptcha = await loadRecaptcha(siteKey);
    return await executeRecaptcha(grecaptcha, siteKey, action);
  } catch {
    return null;
  }
};
