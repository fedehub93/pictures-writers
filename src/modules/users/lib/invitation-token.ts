import { createHash, randomBytes } from "node:crypto";

export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export const createInvitationToken = () => {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
};

export const hashInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const invitationExpiry = (now = new Date()) =>
  new Date(now.getTime() + INVITATION_TTL_MS);

export const isInvitationUsable = (invitation: {
  status: "PENDING" | "ACCEPTED" | "CANCELLED";
  expiresAt: Date;
}, now = new Date()) =>
  invitation.status === "PENDING" && invitation.expiresAt > now;

export const withoutInvitationTokenHash = <T extends { tokenHash: string }>({
  tokenHash: _tokenHash,
  ...invitation
}: T) => invitation;
