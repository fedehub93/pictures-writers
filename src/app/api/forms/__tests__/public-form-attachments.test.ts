import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/recaptcha", () => ({
  verifyRecaptcha: vi.fn(async () => ({ success: true })),
}));

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

import { submitForm } from "@/actions/submit-form";
import { formSubmissionsRouter } from "@/modules/forms/submissions/server/procedures";
import {
  PUBLIC_FORM_ATTACHMENT_MAX_UPLOAD_BYTES,
} from "@/shared/lib/public-form-upload";
import {
  PUBLIC_FORM_UPLOAD_CLIENT_LIMIT,
  PUBLIC_FORM_UPLOAD_FORM_LIMIT,
  resetPublicFormUploadRateLimit,
} from "@/modules/forms/server/public-attachments";
import { BYTES_PER_MEGABYTE } from "@/modules/media/lib/quota";
import {
  getMediaQuotaStatus,
  getMediaUsageBytes,
} from "@/modules/media/server/media-quota";
import {
  resetMediaQuota,
  setMediaQuotaMb,
  setPublicOriginReserveMb,
} from "@/modules/media/server/__tests__/quota-fixtures";
import {
  resetStorageDriverSetting,
  setStorageDriverSetting,
} from "@/modules/media/server/__tests__/storage-setting-fixtures";

import { GET as getFile } from "@/app/files/[...path]/route";
import { POST as postAdminAttachment } from "../../files/attachments/route";
import { POST as postPublicAttachment } from "../[formId]/attachments/route";

const createSubmissionsCaller = createCallerFactory(formSubmissionsRouter);

const PDF_BYTES = new TextEncoder().encode("%PDF-1.4 public form attachment");

function uploadRequest(
  formId: string,
  bytes: Uint8Array<ArrayBuffer>,
  fileName: string,
  mimeType: string,
  clientIp: string,
): Request {
  const form = new FormData();
  form.append("file", new File([bytes], fileName, { type: mimeType }));

  return new Request(
    `http://localhost/api/forms/${formId}/attachments`,
    {
      method: "POST",
      body: form,
      headers: { "x-forwarded-for": clientIp },
    },
  );
}

function uploadContext(formId: string) {
  return { params: Promise.resolve({ formId }) };
}

function deliveryRequest(url: string): Request {
  return new Request(new URL(url, "http://localhost"), { method: "GET" });
}

function deliveryContext(url: string) {
  return {
    params: Promise.resolve({
      path: url.split("?")[0].split("/").filter(Boolean).slice(1),
    }),
  };
}

async function exists(filePath: string): Promise<boolean> {
  return stat(filePath).then(
    () => true,
    () => false,
  );
}

async function listFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
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

describe("public form attachments", () => {
  let root: string;
  let previousEnv: Record<string, string | undefined>;
  let formIds: string[];
  let storedFileIds: string[];

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "public-form-files-"));
    formIds = [];
    storedFileIds = [];
    resetPublicFormUploadRateLimit();

    previousEnv = {
      MEDIA_STORAGE_LOCAL_ROOT: process.env.MEDIA_STORAGE_LOCAL_ROOT,
      MEDIA_STORAGE_DRIVER: process.env.MEDIA_STORAGE_DRIVER,
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    };

    process.env.MEDIA_STORAGE_LOCAL_ROOT = root;
    // The environment still names the provider with no token; only the saved
    // choice can make the upload land on disk.
    process.env.MEDIA_STORAGE_DRIVER = "uploadthing";
    process.env.UPLOADTHING_TOKEN = "";
    await setStorageDriverSetting("local");
  });

  afterEach(async () => {
    await db.formSubmission
      .deleteMany({ where: { formId: { in: formIds } } })
      .catch(() => undefined);
    await db.storedFile
      .deleteMany({ where: { id: { in: storedFileIds } } })
      .catch(() => undefined);
    await db.form
      .deleteMany({ where: { id: { in: formIds } } })
      .catch(() => undefined);

    resetPublicFormUploadRateLimit();
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

  async function createForm() {
    const form = await db.form.create({
      data: { name: `Public form ${randomUUID()}` },
    });
    formIds.push(form.id);
    return form;
  }

  it("serves a visitor's PDF from the Installation's domain and claims it for the submission", async () => {
    const form = await createForm();
    const usageBefore = await getMediaUsageBytes();

    const response = await postPublicAttachment(
      uploadRequest(
        form.id,
        PDF_BYTES,
        "essay.pdf",
        "application/pdf",
        "203.0.113.10",
      ),
      uploadContext(form.id),
    );
    const uploaded = await response.json();
    storedFileIds.push(uploaded.storedFileId);

    expect(response.status).toBe(200);
    expect(uploaded).toMatchObject({
      url: expect.stringMatching(/^\/files\//),
      name: "essay.pdf",
      type: "application/pdf",
      size: PDF_BYTES.byteLength,
    });
    expect(uploaded.url).not.toContain("://");

    const record = await db.storedFile.findUniqueOrThrow({
      where: { id: uploaded.storedFileId },
    });
    expect(record).toMatchObject({
      kind: StoredFileKind.ATTACHMENT,
      origin: StoredFileOrigin.PUBLIC,
      driver: "local",
      remoteUrl: null,
      contentType: "application/pdf",
      size: PDF_BYTES.byteLength,
    });
    await expect(getMediaUsageBytes()).resolves.toBe(
      usageBefore + PDF_BYTES.byteLength,
    );

    const result = await submitForm(
      form.id,
      {
        email: `visitor-${randomUUID()}@example.com`,
        essay: [
          {
            storedFileId: uploaded.storedFileId,
            // A crafted answer must not be able to teach the submission a
            // provider address: the server recomposes these from the record.
            name: "essay.pdf",
            url: "https://utfs.io/f/provider-address",
            size: 1,
            type: "text/plain",
            key: "provider-key",
          },
        ],
      },
      "recaptcha-token",
    );

    expect(result.success).toBe(true);

    const submission = await db.formSubmission.findFirstOrThrow({
      where: { formId: form.id },
      include: { attachments: true },
    });

    // The answer points at the canonical address and at the attachment, never
    // at a provider.
    const answer = (
      submission.data as Record<
        string,
        { storedFileId: string; name: string; url: string; size: number; type: string }[]
      >
    ).essay[0];
    expect(answer).toEqual({
      storedFileId: uploaded.storedFileId,
      name: "essay.pdf",
      url: uploaded.url,
      size: PDF_BYTES.byteLength,
      type: "application/pdf",
    });
    expect(JSON.stringify(submission.data)).not.toContain("://");
    expect(submission.attachments).toHaveLength(1);
    expect(submission.attachments[0]).toMatchObject({
      formSubmissionId: submission.id,
      storedFileId: uploaded.storedFileId,
      filename: "essay.pdf",
    });

    const delivered = await getFile(
      deliveryRequest(uploaded.url),
      deliveryContext(uploaded.url),
    );
    expect(delivered.status).toBe(200);
    expect(delivered.headers.get("content-type")).toBe("application/pdf");
    expect(delivered.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(new Uint8Array(await delivered.arrayBuffer())).toEqual(PDF_BYTES);

    // Deleting the submission removes the owned objects through the driver
    // recorded on the file, then the record.
    const caller = createSubmissionsCaller({
      userId: "admin-user",
      auth: { id: "admin-user" },
    });
    await caller.remove({ id: submission.id });

    expect(
      await db.storedFile.findUnique({
        where: { id: uploaded.storedFileId },
      }),
    ).toBeNull();
    expect(
      await exists(path.join(root, ...uploaded.url.slice("/files/".length).split("/"))),
    ).toBe(false);
    // The bytes stop counting with the attachment's owner.
    await expect(getMediaUsageBytes()).resolves.toBe(usageBefore);
  });

  it("refuses a file over the cap with a machine-readable answer and writes nothing", async () => {
    const form = await createForm();
    const oversized = new Uint8Array(PUBLIC_FORM_ATTACHMENT_MAX_UPLOAD_BYTES + 1);
    const before = await db.storedFile.count({
      where: { kind: StoredFileKind.ATTACHMENT, origin: StoredFileOrigin.PUBLIC },
    });

    const response = await postPublicAttachment(
      uploadRequest(
        form.id,
        oversized,
        "big.pdf",
        "application/pdf",
        "203.0.113.11",
      ),
      uploadContext(form.id),
    );
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      code: "FILE_TOO_LARGE",
      maxBytes: PUBLIC_FORM_ATTACHMENT_MAX_UPLOAD_BYTES,
    });
    expect(
      await db.storedFile.count({
        where: { kind: StoredFileKind.ATTACHMENT, origin: StoredFileOrigin.PUBLIC },
      }),
    ).toBe(before);
    expect(await readdir(root).catch(() => [])).toEqual([]);
  });

  it("refuses a public upload at the reserve while an admin upload at the same moment succeeds", async () => {
    const form = await createForm();
    const before = await getMediaQuotaStatus();

    await setMediaQuotaMb(
      Math.ceil((before.usedBytes + 4 * BYTES_PER_MEGABYTE) / BYTES_PER_MEGABYTE),
    );
    await setPublicOriginReserveMb(1);

    // Spend the public reserve with a real upload: the visitor's budget is now
    // exactly its 1 MB ceiling.
    const seedBytes = new Uint8Array(BYTES_PER_MEGABYTE).fill(7);
    const seedResponse = await postPublicAttachment(
      uploadRequest(
        form.id,
        seedBytes,
        "seed.pdf",
        "application/pdf",
        "203.0.113.60",
      ),
      uploadContext(form.id),
    );
    const seed = await seedResponse.json();
    storedFileIds.push(seed.storedFileId);
    expect(seedResponse.status).toBe(200);

    const filesBefore = await listFiles(root);
    const recordsBefore = await db.storedFile.count();

    const adminBytes = new TextEncoder().encode("an admin attachment");
    const [publicResponse, adminResponse] = await Promise.all([
      postPublicAttachment(
        uploadRequest(
          form.id,
          new TextEncoder().encode("one visitor over the reserve"),
          "over.pdf",
          "application/pdf",
          "203.0.113.61",
        ),
        uploadContext(form.id),
      ),
      postAdminAttachment(
        new Request("http://localhost/api/files/attachments", {
          method: "POST",
          body: (() => {
            const body = new FormData();
            body.append(
              "file",
              new File([adminBytes], "admin.pdf", { type: "application/pdf" }),
            );
            return body;
          })(),
        }),
      ),
    ]);

    const publicBody = await publicResponse.json();
    const adminBody = await adminResponse.json();
    storedFileIds.push(adminBody.storedFileId);

    expect(publicResponse.status).toBe(413);
    expect(publicBody).toMatchObject({
      code: "PUBLIC_ORIGIN_RESERVE_EXCEEDED",
      reserveMb: 1,
    });
    expect(adminResponse.status).toBe(200);

    // Only the admin upload wrote a record and an object: the refusal cost
    // nothing.
    expect(await db.storedFile.count()).toBe(recordsBefore + 1);
    expect(await listFiles(root)).toHaveLength(filesBefore.length + 1);

    const after = await getMediaQuotaStatus();
    expect(after.publicBytes).toBe(before.publicBytes + seedBytes.byteLength);
    expect(after.usedBytes).toBe(
      before.usedBytes + seedBytes.byteLength + adminBytes.byteLength,
    );
  });

  it("refuses a burst from one client", async () => {
    const form = await createForm();
    const clientIp = "198.51.100.7";
    const before = await db.storedFile.count();

    for (let i = 0; i < PUBLIC_FORM_UPLOAD_CLIENT_LIMIT.maxRequests; i++) {
      const response = await postPublicAttachment(
        uploadRequest(
          form.id,
          new TextEncoder().encode(`file ${i}`),
          `file-${i}.pdf`,
          "application/pdf",
          clientIp,
        ),
        uploadContext(form.id),
      );
      const body = await response.json();
      expect(response.status).toBe(200);
      storedFileIds.push(body.storedFileId);
    }

    const refused = await postPublicAttachment(
      uploadRequest(
        form.id,
        new TextEncoder().encode("one too many"),
        "extra.pdf",
        "application/pdf",
        clientIp,
      ),
      uploadContext(form.id),
    );
    const body = await refused.json();

    expect(refused.status).toBe(429);
    expect(body).toMatchObject({ code: "RATE_LIMITED" });
    expect(body.retryAfterSeconds).toBeGreaterThan(0);
    expect(refused.headers.get("retry-after")).toBeTruthy();
    // The refused request wrote neither a record nor bytes.
    expect(await db.storedFile.count()).toBe(
      before + PUBLIC_FORM_UPLOAD_CLIENT_LIMIT.maxRequests,
    );
  });

  it("refuses a burst against one form even from many clients", async () => {
    const form = await createForm();

    for (let i = 0; i < PUBLIC_FORM_UPLOAD_FORM_LIMIT.maxRequests; i++) {
      const response = await postPublicAttachment(
        uploadRequest(
          form.id,
          new TextEncoder().encode(`form file ${i}`),
          `form-file-${i}.pdf`,
          "application/pdf",
          `198.51.100.${i}`,
        ),
        uploadContext(form.id),
      );
      const body = await response.json();
      expect(response.status).toBe(200);
      storedFileIds.push(body.storedFileId);
    }

    const refused = await postPublicAttachment(
      uploadRequest(
        form.id,
        new TextEncoder().encode("form burst"),
        "form-extra.pdf",
        "application/pdf",
        "198.51.100.200",
      ),
      uploadContext(form.id),
    );
    const body = await refused.json();

    expect(refused.status).toBe(429);
    expect(body).toMatchObject({ code: "RATE_LIMITED" });
  });

  it("does not spend the form's budget on requests that carry no file", async () => {
    const form = await createForm();

    for (let i = 0; i < PUBLIC_FORM_UPLOAD_FORM_LIMIT.maxRequests; i++) {
      const empty = await postPublicAttachment(
        new Request(`http://localhost/api/forms/${form.id}/attachments`, {
          method: "POST",
          headers: { "x-forwarded-for": `192.0.2.${i}` },
        }),
        uploadContext(form.id),
      );

      expect(empty.status).toBe(400);
      expect((await empty.json()).code).toBe("NO_FILE");
    }

    // An empty POST is not an upload: the form still accepts a real file.
    const accepted = await postPublicAttachment(
      uploadRequest(
        form.id,
        PDF_BYTES,
        "real.pdf",
        "application/pdf",
        "192.0.2.200",
      ),
      uploadContext(form.id),
    );
    const body = await accepted.json();
    storedFileIds.push(body.storedFileId);

    expect(accepted.status).toBe(200);
  });

  it("refuses a submission whose attachment was not uploaded publicly", async () => {
    const form = await createForm();
    const internal = await db.storedFile.create({
      data: {
        key: `default/${randomUUID()}/1/internal.pdf`,
        driver: "local",
        contentType: "application/pdf",
        size: 4,
        kind: StoredFileKind.ATTACHMENT,
        origin: StoredFileOrigin.INTERNAL,
      },
    });
    storedFileIds.push(internal.id);

    const result = await submitForm(
      form.id,
      { email: `visitor-${randomUUID()}@example.com`, essay: [{ storedFileId: internal.id }] },
      "recaptcha-token",
    );

    expect(result.success).toBe(false);
    expect(
      await db.formSubmission.count({ where: { formId: form.id } }),
    ).toBe(0);
    expect(
      await db.attachment.count({ where: { storedFileId: internal.id } }),
    ).toBe(0);
  });
});
