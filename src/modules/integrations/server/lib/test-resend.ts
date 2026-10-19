import "server-only";

import { Resend } from "resend";

export interface ResendTestResult {
  success: boolean;
  error?: string;
}

/**
 * Test a Resend API key with a read-only operation.
 *
 * `emails.list` is used because it is a safe GET request that validates the
 * key without mutating state. Sending-only keys succeed here; full-access keys
 * are required for receiving webhooks.
 */
export async function testResendConnection(apiKey: string): Promise<ResendTestResult> {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.list({ limit: 1 });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
