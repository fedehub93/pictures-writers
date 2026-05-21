import { EmailSingleSend } from "@/generated/prisma";

import {
  getSingleSendById,
  getSingleSends,
} from "./server/services/data";

type CustomEmailAudience = { _count: { contacts: number } };

export type EmailSingleSendCustom = EmailSingleSend & {
  _count: { emailSingleSendLogs: number };
  audiences: CustomEmailAudience[];
  totalSends: number;
  totalContacts: number;
};

export type GetSingleSends = Awaited<ReturnType<typeof getSingleSends>>[number];
export type GetSingleSendById = Awaited<ReturnType<typeof getSingleSendById>>;
