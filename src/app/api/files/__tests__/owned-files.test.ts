import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-service", () => ({
  authAdmin: async () => ({ id: "admin-user" }),
}));

vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

import { createCallerFactory } from "@/trpc/init";

import { StoredFileKind, StoredFileOrigin } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { conversationsRouter } from "@/modules/mails/conversations/server/procedures";
import { usersRouter } from "@/modules/users/server/procedures";
import { sendConversationMessage } from "@/modules/mails/conversations/lib/send-one-to-one";
import { createOwnedAttachmentStorage } from "@/modules/mails/conversations/lib/attachment-storage";
import { handleInboundEmail } from "@/modules/mails/conversations/lib/handle-inbound-email";
import type {
  EmailInboundAdapter,
  EmailProviderAdapter,
  InboundEmail,
  SendOneToOneParams,
} from "@/modules/mails/lib/types";
import {
  inboundAdapterStubs,
  providerAdapterStubs,
} from "@/modules/mails/lib/__tests__/inbound-adapter-stubs";
import {
  deleteMediaPermanentlyBatch,
  MediaNotFoundError,
} from "@/modules/media/server/media-service";
import { auditMediaLibrary } from "@/modules/media/server/media-audit";
import {
  getMediaUsageBytes,
  PublicOriginReserveExceededError,
} from "@/modules/media/server/media-quota";
import {
  deleteUserAvatarObjects,
  storeOwnedFile,
} from "@/modules/media/server/owned-file";
import { createLocalStorageDriver } from "@/modules/media/server/storage/local";
import { BYTES_PER_MEGABYTE } from "@/modules/media/lib/quota";
import {
  resetMediaQuota,
  setMediaQuotaMb,
  setPublicOriginReserveMb,
} from "@/modules/media/server/__tests__/quota-fixtures";
import {
  resetStorageDriverSetting,
  setStorageDriverSetting,
} from "@/modules/media/server/__tests__/storage-setting-fixtures";

import { GET as getFile, HEAD as headFile } from "@/app/files/[...path]/route";
import { GET as getMedia } from "@/app/media/[...path]/route";
import { POST as postAttachment } from "../attachments/route";
import { POST as postAvatar } from "../avatars/route";

const createConversationsCaller = createCallerFactory(conversationsRouter);
const createUsersCaller = createCallerFactory(usersRouter);

const PDF_BYTES = new TextEncoder().encode("%PDF-1.4 attachment bytes");
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03,
]);

function uploadRequest(
  url: string,
  bytes: Uint8Array<ArrayBuffer>,
  fileName: string,
  mimeType: string,
): Request {
  const form = new FormData();
  form.append("file", new File([bytes], fileName, { type: mimeType }));

  return new Request(url, { method: "POST", body: form });
}

function deliveryRequest(url: string, init?: RequestInit): Request {
  return new Request(new URL(url, "http://localhost"), {
    method: "GET",
    ...init,
  });
}

function deliveryContext(url: string) {
  return {
    params: Promise.resolve({
      path: url.split("?")[0].split("/").filter(Boolean).slice(1),
    }),
  };
}

function recordingAdapter() {
  const sent: SendOneToOneParams[] = [];
  const adapter: EmailProviderAdapter = {
    ...providerAdapterStubs,
    sendOneToOne: async (params) => {
      sent.push(params);
      return { success: true, externalId: "provider-1" };
    },
  };

  return { adapter, sent };
}

async function exists(filePath: string): Promise<boolean> {
  return stat(filePath).then(
    () => true,
    () => false,
  );
}

async function listFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relative)),
      );
    } else {
      files.push(relative);
    }
  }

  return files;
}

describe("attachments and avatars on the Installation's own domain", () => {
  let root: string;
  let previousEnv: Record<string, string | undefined>;
  let storedKeys: string[];
  let accountIds: string[];
  let userIds: string[];
  let roleIds: string[];

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "owned-files-"));
    storedKeys = [];
    accountIds = [];
    userIds = [];
    roleIds = [];

    previousEnv = {
      MEDIA_STORAGE_LOCAL_ROOT: process.env.MEDIA_STORAGE_LOCAL_ROOT,
      MEDIA_STORAGE_DRIVER: process.env.MEDIA_STORAGE_DRIVER,
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    process.env.MEDIA_STORAGE_LOCAL_ROOT = root;
    // The environment still names the provider with no token; only the saved
    // choice can make the upload land on disk.
    process.env.MEDIA_STORAGE_DRIVER = "uploadthing";
    process.env.UPLOADTHING_TOKEN = "";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
    await setStorageDriverSetting("local");
  });

  afterEach(async () => {
    vi.unstubAllGlobals();

    for (const id of accountIds) {
      await db.emailAccount.delete({ where: { id } }).catch(() => undefined);
    }
    for (const id of userIds) {
      await db.user.delete({ where: { id } }).catch(() => undefined);
    }
    for (const id of roleIds) {
      await db.role.delete({ where: { id } }).catch(() => undefined);
    }
    if (storedKeys.length > 0) {
      await db.storedFile
        .deleteMany({ where: { key: { in: storedKeys } } })
        .catch(() => undefined);
    }

    await resetStorageDriverSetting();
    await resetMediaQuota();
    await rm(root, { recursive: true, force: true });

    for (const [name, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  async function createConversation() {
    const account = await db.emailAccount.create({
      data: {
        name: "Support",
        email: `support-${randomUUID()}@example.com`,
      },
    });
    accountIds.push(account.id);

    const conversation = await db.conversation.create({
      data: {
        emailAccountId: account.id,
        contactEmail: `reader-${randomUUID()}@example.com`,
      },
    });

    return { account, conversation };
  }

  it("attaches a file without a provider token and serves it from /files/<key>", async () => {
    const { conversation } = await createConversation();
    const mediaBefore = await db.media.count();

    const uploadResponse = await postAttachment(
      uploadRequest(
        "http://localhost/api/files/attachments",
        PDF_BYTES,
        "brief.pdf",
        "application/pdf",
      ),
    );
    const uploaded = await uploadResponse.json();
    storedKeys.push(uploaded.url.slice("/files/".length));

    expect(uploadResponse.status).toBe(200);
    expect(uploaded).toMatchObject({
      url: expect.stringMatching(/^\/files\//),
      filename: "brief.pdf",
      contentType: "application/pdf",
      size: PDF_BYTES.byteLength,
    });
    expect(uploaded.url).not.toContain("://");

    const fileRecord = await db.storedFile.findUniqueOrThrow({
      where: { id: uploaded.storedFileId },
    });
    expect(fileRecord).toMatchObject({
      driver: "local",
      remoteUrl: null,
      contentType: "application/pdf",
      size: PDF_BYTES.byteLength,
      kind: StoredFileKind.ATTACHMENT,
    });

    const { adapter, sent } = recordingAdapter();
    await sendConversationMessage({
      conversationId: conversation.id,
      bodyHtml: "<p>Here is the brief</p>",
      attachments: [
        { storedFileId: uploaded.storedFileId, filename: "brief.pdf" },
      ],
      adapter,
    });

    expect(sent[0]!.attachments).toEqual([
      {
        filename: "brief.pdf",
        contentType: "application/pdf",
        url: `https://app.test${uploaded.url}`,
        size: PDF_BYTES.byteLength,
      },
    ]);

    const response = await getFile(
      deliveryRequest(uploaded.url),
      deliveryContext(uploaded.url),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("etag")).toBeTruthy();
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("content-security-policy")).toBe("sandbox");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PDF_BYTES);

    const ranged = await getFile(
      deliveryRequest(uploaded.url, { headers: { range: "bytes=0-3" } }),
      deliveryContext(uploaded.url),
    );
    expect(ranged.status).toBe(206);
    expect(new Uint8Array(await ranged.arrayBuffer())).toEqual(
      PDF_BYTES.slice(0, 4),
    );

    const head = await headFile(
      deliveryRequest(uploaded.url, { method: "HEAD" }),
      deliveryContext(uploaded.url),
    );
    expect(head.status).toBe(200);
    expect(head.headers.get("content-type")).toBe("application/pdf");

    // The file is a role on a stored file, not a library Media: it never
    // appears in the library, cannot be served from /media/ and has no
    // renditions.
    expect(await db.media.count()).toBe(mediaBefore);
    expect(await db.media.count({ where: { key: fileRecord.key } })).toBe(0);

    const wrongPrefix = await getMedia(
      deliveryRequest(`/media/${fileRecord.key}`),
      deliveryContext(`/media/${fileRecord.key}`),
    );
    expect(wrongPrefix.status).toBe(404);

    const active = { driver: createLocalStorageDriver({ root }), name: "local" as const };
    await expect(
      deleteMediaPermanentlyBatch({
        active,
        mediaIds: [fileRecord.id],
      }),
    ).rejects.toBeInstanceOf(MediaNotFoundError);
    expect(
      await db.storedFile.findUnique({ where: { id: fileRecord.id } }),
    ).not.toBeNull();
  });

  it("deletes the attachment's objects and record with the message", async () => {
    const { conversation } = await createConversation();

    const uploadResponse = await postAttachment(
      uploadRequest(
        "http://localhost/api/files/attachments",
        PDF_BYTES,
        "brief.pdf",
        "application/pdf",
      ),
    );
    const uploaded = await uploadResponse.json();
    const key = uploaded.url.slice("/files/".length);
    storedKeys.push(key);

    await sendConversationMessage({
      conversationId: conversation.id,
      bodyHtml: "<p>Here is the brief</p>",
      attachments: [
        { storedFileId: uploaded.storedFileId, filename: "brief.pdf" },
      ],
      adapter: recordingAdapter().adapter,
    });

    await db.conversation.update({
      where: { id: conversation.id },
      data: { deletedAt: new Date() },
    });

    const userId = randomUUID();
    const user = await db.user.create({
      data: { email: `${userId}@example.com` },
    });
    userIds.push(user.id);
    await db.emailAccount.update({
      where: { id: conversation.emailAccountId },
      data: { userPermissions: { create: [{ userId: user.id }] } },
    });

    const caller = createConversationsCaller({
      userId: user.id,
      auth: { id: user.id },
    });
    await caller.deleteForever({ id: conversation.id });

    expect(
      await db.attachment.count({
        where: { emailMessage: { conversationId: conversation.id } },
      }),
    ).toBe(0);
    expect(
      await db.storedFile.findUnique({ where: { id: uploaded.storedFileId } }),
    ).toBeNull();
    expect(await exists(path.join(root, ...key.split("/")))).toBe(false);
  });

  it("copies inbound attachments through the active driver and serves them from /files", async () => {
    const account = await db.emailAccount.create({
      data: {
        name: "Support",
        email: `support-${randomUUID()}@example.com`,
      },
    });
    accountIds.push(account.id);

    const noteBytes = new TextEncoder().encode("a note");
    const attachments = [
      {
        externalId: "att-1",
        filename: "report.pdf",
        contentType: "application/pdf",
        size: PDF_BYTES.byteLength,
      },
      {
        externalId: "att-2",
        filename: "note.txt",
        contentType: "text/plain",
        size: noteBytes.byteLength,
      },
    ];
    const messageId = "<inbound@example.com>";
    const subject = "Two attachments";
    const inbound: InboundEmail = {
      externalId: `inbound-${randomUUID()}`,
      messageId,
      references: [],
      from: "Alice <alice@example.com>",
      to: [account.email],
      cc: [],
      bcc: [],
      subject,
      bodyText: "See attached",
      receivedAt: new Date("2026-11-20T10:00:00.000Z"),
      attachments,
    };
    const adapter: EmailInboundAdapter = {
      ...inboundAdapterStubs,
      fetchInbound: async () => inbound,
      listInboundAttachments: async () => attachments,
      getAttachmentDownloadUrl: async (_emailId, attachmentId) => ({
        url: `https://provider.test/${attachmentId}`,
      }),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        return new Response(
          url.endsWith("att-1") ? PDF_BYTES : noteBytes,
          { status: 200 },
        );
      }),
    );

    const result = await handleInboundEmail(
      {
        email_id: inbound.externalId,
        message_id: messageId,
        from: inbound.from,
        to: inbound.to,
        cc: [],
        bcc: [],
        received_for: [account.email],
        subject,
        created_at: inbound.receivedAt.toISOString(),
      },
      { adapter, storage: createOwnedAttachmentStorage() },
    );

    expect(result.status).toBe("processed");
    if (result.status !== "processed") return;

    const message = await db.emailMessage.findUniqueOrThrow({
      where: { id: result.messageId },
      include: { attachments: { include: { storedFile: true } } },
    });
    expect(message.attachments).toHaveLength(2);
    expect(message.attachments.map((attachment) => attachment.filename)).toEqual(
      ["report.pdf", "note.txt"],
    );

    const expectedContentTypes = ["application/pdf", "text/plain"];
    const delivered: Uint8Array[] = [];
    for (const [index, attachment] of message.attachments.entries()) {
      const file = attachment.storedFile;
      expect(file).toMatchObject({
        driver: "local",
        kind: StoredFileKind.ATTACHMENT,
        origin: "INTERNAL",
      });
      storedKeys.push(file.key);

      const address = `/files/${file.key}`;
      const response = await getFile(
        deliveryRequest(address),
        deliveryContext(address),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe(
        expectedContentTypes[index],
      );
      delivered.push(new Uint8Array(await response.arrayBuffer()));
    }
    expect(delivered).toEqual([PDF_BYTES, noteBytes]);

    // Deleting the conversation that owns the message removes both objects
    // through each file's driver.
    await db.conversation.update({
      where: { id: result.conversationId },
      data: { deletedAt: new Date() },
    });
    const userId = randomUUID();
    const user = await db.user.create({
      data: { email: `${userId}@example.com` },
    });
    userIds.push(user.id);
    await db.emailAccount.update({
      where: { id: account.id },
      data: { userPermissions: { create: [{ userId: user.id }] } },
    });
    const caller = createConversationsCaller({
      userId: user.id,
      auth: { id: user.id },
    });

    await caller.deleteForever({ id: result.conversationId });

    expect(
      await db.storedFile.count({ where: { key: { in: storedKeys } } }),
    ).toBe(0);
    for (const attachment of message.attachments) {
      expect(
        await exists(
          path.join(root, ...attachment.storedFile.key.split("/")),
        ),
      ).toBe(false);
    }
  });

  it("sets an avatar without a provider token and serves it from /files/<key>", async () => {
    const suffix = randomUUID();
    const role = await db.role.create({
      data: { key: `editor-${suffix}`, name: `Editor ${suffix}` },
    });
    roleIds.push(role.id);

    const user = await db.user.create({
      data: {
        email: `avatar-${randomUUID()}@example.com`,
        roleId: role.id,
        accountStatus: "ACTIVE",
      },
    });
    userIds.push(user.id);

    const uploadResponse = await postAvatar(
      uploadRequest(
        "http://localhost/api/files/avatars",
        PNG_BYTES,
        "avatar.png",
        "image/png",
      ),
    );
    const uploaded = await uploadResponse.json();
    const key = uploaded.url.slice("/files/".length);
    storedKeys.push(key);

    expect(uploadResponse.status).toBe(200);
    expect(uploaded.url).toMatch(/^\/files\//);
    expect(
      await db.media.count({ where: { key } }),
    ).toBe(0);

    const caller = createUsersCaller({
      userId: user.id,
      auth: { id: user.id },
    });
    const updated = await caller.update({
      id: user.id,
      firstName: "Ada",
      lastName: null,
      bio: null,
      imageUrl: uploaded.url,
      roleId: role.id,
    });

    expect(updated.imageUrl).toBe(uploaded.url);

    const avatar = await db.storedFile.findUniqueOrThrow({
      where: { id: uploaded.storedFileId },
    });
    expect(avatar).toMatchObject({
      kind: StoredFileKind.AVATAR,
      avatarOwnerId: user.id,
      driver: "local",
    });

    const response = await getFile(
      deliveryRequest(uploaded.url),
      deliveryContext(uploaded.url),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG_BYTES);

    // The account shows the address the admin saved.
    const account = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { imageUrl: true },
    });
    expect(account.imageUrl).toBe(uploaded.url);

    // Replacing the avatar removes the old object and record.
    const replacementResponse = await postAvatar(
      uploadRequest(
        "http://localhost/api/files/avatars",
        PNG_BYTES.slice().reverse(),
        "avatar-2.png",
        "image/png",
      ),
    );
    const replacement = await replacementResponse.json();
    storedKeys.push(replacement.url.slice("/files/".length));

    await caller.update({
      id: user.id,
      imageUrl: replacement.url,
      roleId: role.id,
    });

    expect(
      await db.storedFile.findUnique({ where: { id: uploaded.storedFileId } }),
    ).toBeNull();
    expect(await exists(path.join(root, ...key.split("/")))).toBe(false);

    // Deleting the user removes the replacement too, through the same helper
    // the auth layer's user-delete hook calls.
    const failures = await deleteUserAvatarObjects(user.id);
    expect(failures).toEqual([]);
    expect(await db.storedFile.count({ where: { avatarOwnerId: user.id } })).toBe(
      0,
    );
    expect(
      await exists(
        path.join(root, ...replacement.url.slice("/files/".length).split("/")),
      ),
    ).toBe(false);
  });

  it("redirects a provider-backed avatar with a short, never immutable cache", async () => {
    const key = `default/${randomUUID()}/1/avatar.png`;
    const remoteUrl = "https://provider.test/f/avatar.png";
    storedKeys.push(key);

    await db.storedFile.create({
      data: {
        key,
        driver: "uploadthing",
        remoteUrl,
        contentType: "image/png",
        size: PNG_BYTES.byteLength,
        kind: StoredFileKind.AVATAR,
      },
    });

    const response = await getFile(
      deliveryRequest(`/files/${key}`),
      deliveryContext(`/files/${key}`),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(remoteUrl);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect(response.headers.get("cache-control")).not.toContain("immutable");
  });

  it("redirects an attachment recorded at an older /media address without calling it a loop", async () => {
    const key = `default/${randomUUID()}/1/report.pdf`;
    storedKeys.push(key);

    await db.storedFile.create({
      data: {
        key,
        driver: "external",
        remoteUrl: "/media/legacy/report.pdf",
        contentType: "application/pdf",
        size: PDF_BYTES.byteLength,
        kind: StoredFileKind.ATTACHMENT,
      },
    });

    const response = await getFile(
      deliveryRequest(`/files/${key}`),
      deliveryContext(`/files/${key}`),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "http://localhost/media/legacy/report.pdf",
    );
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
  });

  it("refuses a public-origin file at the reserve while an internal upload succeeds", async () => {
    const baseline = await getMediaUsageBytes();
    await setMediaQuotaMb(Math.ceil((baseline + 4 * BYTES_PER_MEGABYTE) / BYTES_PER_MEGABYTE));
    await setPublicOriginReserveMb(1);

    // Seed the public share exactly at its reserve. The seed has a record but
    // no object: the assertion is about the budget, not about those bytes.
    const seedId = randomUUID();
    const seedKey = `default/${seedId}/1/seed.pdf`;
    storedKeys.push(seedKey);
    await db.storedFile.create({
      data: {
        id: seedId,
        key: seedKey,
        driver: "local",
        contentType: "application/pdf",
        size: BYTES_PER_MEGABYTE,
        kind: StoredFileKind.ATTACHMENT,
        origin: StoredFileOrigin.PUBLIC,
      },
    });

    const publicBefore = await db.storedFile.count({
      where: { origin: StoredFileOrigin.PUBLIC },
    });
    const bytes = new Uint8Array(1024).fill(9);

    const [publicResult, internalResult] = await Promise.allSettled([
      storeOwnedFile({
        kind: StoredFileKind.ATTACHMENT,
        origin: StoredFileOrigin.PUBLIC,
        filename: "visitor.pdf",
        contentType: "application/pdf",
        bytes,
      }),
      storeOwnedFile({
        kind: StoredFileKind.ATTACHMENT,
        origin: StoredFileOrigin.INTERNAL,
        filename: "admin.pdf",
        contentType: "application/pdf",
        bytes,
      }),
    ]);

    expect(publicResult.status).toBe("rejected");
    if (publicResult.status === "rejected") {
      expect(publicResult.reason).toBeInstanceOf(
        PublicOriginReserveExceededError,
      );
    }

    expect(internalResult.status).toBe("fulfilled");
    if (internalResult.status !== "fulfilled") return;

    storedKeys.push(internalResult.value.key);

    // The refused upload left no bytes and no record; the internal one wrote
    // both, so the two never blocked each other.
    await expect(
      db.storedFile.count({ where: { origin: StoredFileOrigin.PUBLIC } }),
    ).resolves.toBe(publicBefore);
    await expect(listFiles(root)).resolves.toEqual([internalResult.value.key]);
  });

  it("reports an attachment whose driver is not configured instead of losing it", async () => {
    const key = `default/${randomUUID()}/1/report.pdf`;
    storedKeys.push(key);

    const file = await db.storedFile.create({
      data: {
        key,
        driver: "uploadthing",
        remoteUrl: "https://provider.test/f/report.pdf",
        contentType: "application/pdf",
        size: 10,
        kind: StoredFileKind.ATTACHMENT,
      },
    });

    const report = await auditMediaLibrary({
      env: { ...process.env, UPLOADTHING_TOKEN: "" },
      localRoot: root,
    });

    expect(report.unresolved).toContainEqual({
      id: file.id,
      reason: "driver-unconfigured",
    });
    expect(report.drivers).toContainEqual(
      expect.objectContaining({ driver: "uploadthing" }),
    );
  });
});
