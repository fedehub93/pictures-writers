/**
 * Shape of the `subscription.confirmed` Run payload. Shared by the trigger's
 * default palette data and the emitter so the two cannot drift.
 */
export type SubscriptionConfirmedPayload = {
  email: string;
  /** Id of the contact whose address was just confirmed. */
  contactId: string;
  /** ISO timestamp of the confirmation. */
  confirmedAt: string;
};
