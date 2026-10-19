Status: ready-for-agent
Labels: ready-for-agent

# Email Conversations: inbound and one-to-one email

## Problem Statement

The existing mail marketing module manages contacts, audiences, single sends, and templates, but it is strictly outbound and broadcast-oriented. Admins cannot receive incoming emails, reply to a contact from inside the CMS, or send a single email with attachments to a specific address. Every one-to-one interaction must happen outside the platform, fragmenting communication and making it impossible to keep a shared history of conversations tied to contacts.

## Solution

Add a Conversations area to the Mails module. It lets admins configure multiple EmailAccounts on top of the globally configured provider, receive inbound emails with attachments, and send one-to-one replies or new messages with attachments. Messages are grouped into Conversations by contact email address and scoped to an EmailAccount. User access is controlled by EmailAccount permissions.

## User Stories

1. As an admin, I want to create an EmailAccount with a display name, address, signature, and receiving domain, so that the system can send and receive one-to-one email on that address.
2. As an admin, I want to mark one EmailAccount as the default, so that users start with a sensible account selected.
3. As an admin, I want to activate or deactivate an EmailAccount, so that I can retire an address without losing history.
4. As an admin, I want to choose which backoffice users can use each EmailAccount, so that support staff only sees the inboxes they are responsible for.
5. As a backoffice user, I want the Conversations section to show only the EmailAccounts I am allowed to use, so that I do not see inboxes that are not mine.
6. As a backoffice user, I want to select the current EmailAccount from a dropdown, so that I can view and send email for the right address.
7. As a backoffice user, I want to see a list of Conversations for the current EmailAccount, so that I can triage incoming messages.
8. As a backoffice user, I want unread Conversations to be visually highlighted, so that I notice new inbound email quickly.
9. As a backoffice user, I want to open a Conversation and see the full thread of inbound and outbound messages, so that I have the complete context before replying.
10. As a backoffice user, I want to view and download attachments on an inbound message, so that I can access files sent by the contact.
11. As a backoffice user, I want to compose a reply to a Conversation, so that I can respond without leaving the CMS.
12. As a backoffice user, I want the EmailAccount signature to be pre-filled in the composer and editable before sending, so that replies are consistent but I can adapt them.
13. As a backoffice user, I want to attach files to an outbound one-to-one email, so that I can share documents with the contact.
14. As a backoffice user, I want to send a new one-to-one email to an arbitrary address, so that I can start a conversation with someone who is not yet a Contact.
15. As a backoffice user, I want to create a Contact from an unknown sender’s address with one click, so that the conversation can be linked to the CRM without forcing automatic creation.
16. As a backoffice user, I want to archive a Conversation, so that I can keep the inbox clean while preserving history.
17. As a backoffice user, I want to delete a Conversation, so that it moves to a soft-deleted state and can be permanently removed later.
18. As a backoffice user, I want to see the remaining transactional email quota for the day, so that I know how many one-to-one messages I can still send under the provider limit.
19. As the system, I want to receive a provider webhook when an inbound email arrives, so that I can record the message.
20. As the system, I want to verify the webhook signature before processing an inbound event, so that spoofed emails are rejected.
21. As the system, I want to match an inbound email to an EmailAccount by its `to` address, so that the message lands in the right inbox.
22. As the system, I want to fetch the email body and attachments from the provider after receiving the webhook metadata, so that large payloads do not hit the webhook endpoint.
23. As the system, I want to persist inbound attachments to application storage, so that they remain available after the provider’s signed URL expires.
24. As the system, I want to discard inbound email addressed to an unknown account, so that misrouted or spam mail does not pollute the database.
25. As the system, I want to group inbound and outbound messages into a Conversation by contact email address and EmailAccount, so that the thread view is coherent.
26. As the system, I want to record every outbound one-to-one message as an EmailMessage, so that the thread is complete and auditable.
27. As the system, I want to update a Conversation’s `hasUnread` flag when a new inbound message arrives, so that the inbox badge is accurate.
28. As the system, I want to enforce `maxEmailsPerDay` globally across all one-to-one and transactional sends, so that we respect the provider quota.

## Implementation Decisions

- **Provider-global, multi-account model**. There is one global email provider/API key (existing `EmailSetting`). `EmailAccount` records live on top of it and represent only the address, display name, signature, activation state, and receiving domain. This is recorded in ADR-0022.
- **Permissions are per-account**. A join table `EmailAccountUserPermission` links backoffice users to the accounts they may use. No account permission means no access to Conversations.
- **Conversations belong to one EmailAccount and one contact email address**. Threading is by address, not by `In-Reply-To`. A contact may optionally be linked, but it is not required.
- **Manual contact creation**. When an inbound message arrives from an unknown address, the system records the conversation but does not auto-create a `Contact`. The UI offers a “Create contact” action.
- **Inbound attachments are copied to application storage**. The provider returns signed download URLs that expire; we fetch and store the files so they remain reachable.
- **Outbound attachments are uploaded through the existing application storage flow** before the message is sent, then referenced by URL in the provider payload.
- **One-to-one sends count against `maxEmailsPerDay`**. Broadcast/SingleSend sends do not. The existing `getTodayEmailsAvailable` logic must be updated to reflect this semantic.
- **Email message schema** captures direction, status, addresses, body variants, provider ids, and headers for future threading if needed.

The schema encodes the core shape:

```prisma
enum EmailMessageDirection {
  INBOUND
  OUTBOUND
}

enum EmailMessageStatus {
  RECEIVED
  SENT
  DELIVERED
  BOUNCED
  FAILED
}

model EmailAccount {
  id          String   @id @default(uuid())
  name        String
  email       String   @unique
  displayName String?
  signature   String?
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)

  userPermissions EmailAccountUserPermission[]
  conversations   Conversation[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model EmailAccountUserPermission {
  id String @id @default(uuid())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  emailAccount   EmailAccount @relation(fields: [emailAccountId], references: [id], onDelete: Cascade)
  emailAccountId String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, emailAccountId])
}

model Conversation {
  id String @id @default(uuid())

  contactEmail String
  contactName  String?

  contact   EmailContact? @relation(fields: [contactId], references: [id], onDelete: SetNull)
  contactId String?

  emailAccount   EmailAccount @relation(fields: [emailAccountId], references: [id], onDelete: Cascade)
  emailAccountId String

  messages   EmailMessage[]
  hasUnread  Boolean   @default(false)
  archivedAt DateTime?
  deletedAt  DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([emailAccountId])
  @@index([contactEmail])
}

model EmailMessage {
  id String @id @default(uuid())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  conversationId String

  direction EmailMessageDirection
  status    EmailMessageStatus @default(RECEIVED)

  subject      String?
  bodyHtml     String?
  bodyText     String?
  fromAddress  String
  toAddresses  String[]
  ccAddresses  String[]
  bccAddresses String[]

  messageId  String?
  inReplyTo  String?
  references String[]
  externalId String?

  sentAt DateTime?

  attachments EmailAttachment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([conversationId])
  @@index([externalId])
}

model EmailAttachment {
  id String @id @default(uuid())

  emailMessage   EmailMessage @relation(fields: [emailMessageId], references: [id], onDelete: Cascade)
  emailMessageId String

  filename    String
  contentType String
  size        Int?
  url         String
  externalId  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- **Inbound flow**. A new webhook endpoint consumes `email.received` events, verifies the signature, matches `to` to an active `EmailAccount`, fetches body and attachment metadata, downloads attachments to storage, and creates the `Conversation`, `EmailMessage`, and `EmailAttachment` rows.
- **Outbound flow**. A tRPC mutation composes the reply, validates quota, uploads attachments, calls the adapter, and creates the outbound `EmailMessage` with status `SENT`.
- **UI split**. The Mails module is split into two macro sections: Marketing (Templates, Audiences, Contacts, Single Sends) and Conversations (Inbox, Accounts).

## Testing Decisions

- Tests should exercise external behavior, not implementation details. For the adapter, that means asserting the contract with a mocked Resend client, not asserting internal method calls.
- **Adapter seam**: extend `src/modules/mails/lib/adapters/__tests__/resend-adapter.test.ts` with tests for `sendOneToOne`, `fetchInbound`, and attachment retrieval. This is the highest existing seam for provider interaction.
- **Inbound orchestration seam**: add tests for the webhook handler that verify routing, signature verification, unknown-address discard, and creation of Conversation/Message/Attachment using mocked provider and storage.
- **Outbound use-case seam**: add tests for the reply/new-message flow that verify quota enforcement, contact linking, and provider invocation. These should run against the test database like the existing single-send tests.
- **tRPC seam**: add procedure tests that verify permission scoping (user sees only allowed accounts) and validation, following the pattern used for audiences and single-sends.

## Out of Scope

- Automatic forwarding of inbound email to another address.
- Reusable templates or snippets for one-to-one replies.
- Push or email notifications for new conversations.
- Automatic retention/deletion policies.
- Threading by `Message-Id` / `In-Reply-To` (grouping is by contact email only).
- Per-account provider or API key.
- Receiving the same address on multiple accounts.
- Email encryption or PGP.
- SMS or other channels.

## Further Notes

- Webhook signatures must always be verified, aligned with the security pattern already used for other provider webhooks in the repo.
- Conversation deletion is soft (`deletedAt`). A future iteration can add a trash view and permanent deletion.
- The default `EmailAccount` is used when a user has not selected another account; only one account should be marked default at a time.
- The `emailResponse` / `emailSender` fields in `EmailSetting` remain dedicated to system and marketing sends. Conversations use `EmailAccount` addresses.
- Inbound routing is exact match on the `to` address. Wildcard or catch-all addresses are not supported in this iteration.
