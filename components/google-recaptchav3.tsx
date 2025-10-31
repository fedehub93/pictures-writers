import Link from "next/link";

export const GoogleRecaptchaV3 = () => {
  return (
    <div className="text-sm text-muted-foreground">
      This site is protected by reCAPTCHA and the Google
      <Link href="https://policies.google.com/privacy" className="text-primary">
        {" "}
        Privacy Policy
      </Link>{" "}
      and
      <Link href="https://policies.google.com/terms" className="text-primary">
        {" "}
        Terms of Service
      </Link>{" "}
      apply.
    </div>
  );
};
