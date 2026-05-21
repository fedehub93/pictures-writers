interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyRecaptcha(
  token: string,
  expectedAction: string
): Promise<{
  success: boolean;
  score?: number;
  error?: string;
}> {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      throw new Error("No RECAPTCHA v3 secret key found");
    }

    const url = new URL("https://www.google.com/recaptcha/api/siteverify");
    url.searchParams.append("secret", secretKey);
    url.searchParams.append("response", token);

    const res = await fetch(url, { method: "POST" });

    if (!res.ok) {
      return {
        success: false,
        error: "Failed to verify reCAPTCHA",
      };
    }

    const result: RecaptchaVerificationResult = await res.json();

    if (!result.success) {
      return {
        success: false,
        error:
          result["error-codes"]?.join(", ") || "reCAPTCHA verification failed",
      };
    }

    // For reCAPTCHA v3, check the score (0.0 to 1.0)
    // 0.5 is the recommended threshold
    if (result.score !== undefined && result.score < 0.7) {
      return {
        success: false,
        score: result.score,
        error: "Security verification failed. Please try again.",
      };
    }

    // Verify the action name matches what we expect
    if (result.action && result.action !== expectedAction) {
      return {
        success: false,
        error: "Invalid action name",
      };
    }

    return {
      success: true,
      score: result.score,
    };
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: "Network error during security verification",
    };
  }
}
