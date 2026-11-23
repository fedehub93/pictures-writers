import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  AdItemSourceType,
  AdLayoutType,
  ContentStatus,
  EmailMessageDirection,
  MediaType,
  ProductType,
  SiteRegionKey,
  StoredFileKind,
  type Prisma,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  decodeMediaManifest,
  buildMediaDeliveryUrl,
  MEDIA_MANIFEST_PARAM,
} from "@/modules/media/lib/manifest";
import { storedFilePath } from "@/modules/media/lib/file-path";
import { mediaRenditionLocations } from "@/modules/media/lib/renditions";
import { parseSrc } from "@/modules/media/lib/url";

import { auditMediaLibrary, mediaAuditExitCode } from "../media-audit";
import {
  addressSweepExitCode,
  formatAddressSweepReport,
  sweepStorageAddresses,
} from "../address-sweep";
import type { StorageEnvironment } from "../storage/driver";

const PROVIDER_ORIGIN = "https://fake-app.ufs.sh/f/";

function providerUrl(key: string): string {
  return `${PROVIDER_ORIGIN}${key}`;
}

interface RemoteMedia {
  mediaId: string;
  fileId: string;
  key: string;
  renditionKey: string;
  oldUrl: string;
  /** What content becomes: a token of own-domain rendition addresses. */
  canonicalUrl: string;
  providerOriginal: string;
  providerRendition: string;
}

interface RemoteAttachment {
  fileId: string;
  key: string;
  providerUrl: string;
  canonicalUrl: string;
}

describe("sweepStorageAddresses", () => {
  let root: string;
  let env: StorageEnvironment;
  let mediaIds: string[];
  let pageRootIds: string[];
  let regionIds: string[];
  let regionVersionIds: string[];
  let postRootIds: string[];
  let productRootIds: string[];
  let adCampaignIds: string[];
  let formIds: string[];
  let emailAccountIds: string[];
  let userIds: string[];
  let standaloneFileIds: string[];
  let settingsId: string | null;
  let previousLogoUrl: string | null | undefined;
  let createdSettings: boolean;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "media-address-sweep-"));
    env = {
      MEDIA_STORAGE_LOCAL_ROOT: root,
      UPLOADTHING_TOKEN: "fake-token",
    };

    mediaIds = [];
    pageRootIds = [];
    regionIds = [];
    regionVersionIds = [];
    postRootIds = [];
    productRootIds = [];
    adCampaignIds = [];
    formIds = [];
    emailAccountIds = [];
    userIds = [];
    standaloneFileIds = [];
    settingsId = null;
    previousLogoUrl = undefined;
    createdSettings = false;
  });

  afterEach(async () => {
    if (regionVersionIds.length > 0) {
      await db.siteRegionVersion.deleteMany({
        where: { id: { in: regionVersionIds } },
      });
    }
    if (regionIds.length > 0) {
      await db.siteRegion.deleteMany({ where: { id: { in: regionIds } } });
    }
    if (pageRootIds.length > 0) {
      await db.pageRoot.deleteMany({ where: { id: { in: pageRootIds } } });
    }
    if (postRootIds.length > 0) {
      await db.postRoot.deleteMany({ where: { id: { in: postRootIds } } });
    }
    if (productRootIds.length > 0) {
      await db.productRoot.deleteMany({
        where: { id: { in: productRootIds } },
      });
    }
    if (adCampaignIds.length > 0) {
      await db.adCampaign.deleteMany({
        where: { id: { in: adCampaignIds } },
      });
    }
    if (formIds.length > 0) {
      await db.formSubmission.deleteMany({
        where: { formId: { in: formIds } },
      });
      await db.form.deleteMany({ where: { id: { in: formIds } } });
    }
    if (emailAccountIds.length > 0) {
      await db.emailAccount.deleteMany({
        where: { id: { in: emailAccountIds } },
      });
    }
    if (userIds.length > 0) {
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (mediaIds.length > 0) {
      await db.media.deleteMany({ where: { id: { in: mediaIds } } });
    }
    if (standaloneFileIds.length > 0) {
      await db.storedFile.deleteMany({
        where: { id: { in: standaloneFileIds } },
      });
    }

    if (settingsId) {
      if (createdSettings) {
        await db.settings.delete({ where: { id: settingsId } }).catch(() => {});
      } else {
        await db.settings.update({
          where: { id: settingsId },
          data: { logoUrl: previousLogoUrl ?? null },
        });
      }
    }

    await rm(root, { recursive: true, force: true });
  });

  async function createRemoteMedia(): Promise<RemoteMedia> {
    const id = randomUUID();
    const key = `default/${id}/1/original`;
    const renditionKey = `default/${id}/1/720.webp`;
    const providerOriginal = providerUrl(key);
    // The provider names a generated file with its own opaque id, never with
    // the Installation's key, so the manifest entry is the only place that
    // address is recorded.
    const providerRendition = providerUrl(`provider-${randomUUID()}`);

    const oldUrl = buildMediaDeliveryUrl(providerOriginal, {
      revision: 1,
      archived: false,
      renditions: [{ width: 720, format: "webp", url: providerRendition }],
    });

    const canonicalUrl = buildMediaDeliveryUrl(storedFilePath("MEDIA", key), {
      revision: 1,
      archived: false,
      renditions: [
        { width: 720, format: "webp", url: storedFilePath("MEDIA", renditionKey) },
      ],
    });

    const media = await db.media.create({
      data: {
        id,
        name: `Sweep media ${id}`,
        type: MediaType.IMAGE,
        revision: 1,
        renditions: [
          {
            key: renditionKey,
            width: 720,
            height: 480,
            bytes: 400,
            format: "webp",
            url: providerRendition,
          },
        ],
        storedFile: {
          create: {
            key,
            driver: "uploadthing",
            remoteUrl: providerOriginal,
            contentType: "image/webp",
            size: 1000,
            checksum: "checksum",
          },
        },
      },
      include: { storedFile: { select: { id: true } } },
    });

    mediaIds.push(id);

    return {
      mediaId: media.id,
      fileId: media.storedFile!.id,
      key,
      renditionKey,
      oldUrl,
      canonicalUrl,
      providerOriginal,
      providerRendition,
    };
  }

  async function createRemoteAttachment(): Promise<RemoteAttachment> {
    const key = `attachment-${randomUUID()}.pdf`;

    const file = await db.storedFile.create({
      data: {
        key,
        driver: "uploadthing",
        remoteUrl: providerUrl(key),
        contentType: "application/pdf",
        size: 120,
        kind: StoredFileKind.ATTACHMENT,
      },
    });

    standaloneFileIds.push(file.id);

    return {
      fileId: file.id,
      key,
      providerUrl: providerUrl(key),
      canonicalUrl: `/files/${key}`,
    };
  }

  async function createPage(puckData: unknown): Promise<string> {
    const root = await db.pageRoot.create({
      data: { slug: `sweep-${randomUUID()}` },
    });
    pageRootIds.push(root.id);

    await db.pageVersion.create({
      data: {
        rootId: root.id,
        version: 1,
        title: "Sweep page",
        status: ContentStatus.DRAFT,
        puckData: puckData as PrismaJson.PuckData,
      },
    });

    return root.id;
  }

  async function createRegionVersion(puckData: unknown): Promise<string> {
    let region = await db.siteRegion.findUnique({
      where: { key: SiteRegionKey.HEADER },
      select: { id: true },
    });

    if (!region) {
      region = await db.siteRegion.create({
        data: { key: SiteRegionKey.HEADER },
        select: { id: true },
      });
      regionIds.push(region.id);
    }

    const version = await db.siteRegionVersion.create({
      data: {
        rootId: region.id,
        version: 999_999,
        puckData: puckData as PrismaJson.PuckData,
      },
      select: { id: true },
    });
    regionVersionIds.push(version.id);

    return version.id;
  }

  async function createPost(
    bodyData: unknown,
    tiptapBodyData: unknown,
  ): Promise<string> {
    const root = await db.postRoot.create({
      data: { slug: `sweep-post-${randomUUID()}` },
    });
    postRootIds.push(root.id);

    await db.postVersion.create({
      data: {
        rootId: root.id,
        version: 1,
        title: "Sweep post",
        status: ContentStatus.DRAFT,
        bodyData: bodyData as Prisma.InputJsonValue,
        tiptapBodyData: tiptapBodyData as PrismaJson.TipTapBodyData,
      },
    });

    return root.id;
  }

  async function createProduct(tiptapDescription: unknown): Promise<string> {
    const root = await db.productRoot.create({
      data: { slug: `sweep-product-${randomUUID()}`, type: ProductType.EBOOK },
    });
    productRootIds.push(root.id);

    await db.productVersion.create({
      data: {
        rootId: root.id,
        version: 1,
        title: "Sweep product",
        tiptapDescription:
          tiptapDescription as PrismaJson.TipTapBodyData,
      },
    });

    return root.id;
  }

  async function createAdItem(imageUrl: string): Promise<string> {
    const campaign = await db.adCampaign.create({
      data: { name: `Sweep campaign ${randomUUID()}` },
    });
    adCampaignIds.push(campaign.id);

    const block = await db.adBlock.create({
      data: {
        label: "Sweep block",
        layoutType: AdLayoutType.SINGLE,
        campaignId: campaign.id,
      },
    });

    const item = await db.adItem.create({
      data: {
        sourceType: AdItemSourceType.STATIC,
        adBlockId: block.id,
        imageUrl,
      },
    });

    return item.id;
  }

  async function createSubmission(data: unknown): Promise<string> {
    const form = await db.form.create({
      data: { name: `Sweep form ${randomUUID()}` },
    });
    formIds.push(form.id);

    const submission = await db.formSubmission.create({
      data: {
        formId: form.id,
        data: data as PrismaJson.SubmissionData,
      },
    });

    return submission.id;
  }

  async function createUser(
    image: string,
    imageUrl: string,
  ): Promise<string> {
    const user = await db.user.create({
      data: {
        name: "Sweep user",
        email: `sweep-${randomUUID()}@example.test`,
        image,
        imageUrl,
      },
    });
    userIds.push(user.id);

    return user.id;
  }

  async function setLogo(url: string): Promise<void> {
    const existing = await db.settings.findFirst({
      select: { id: true, logoUrl: true },
    });

    if (existing) {
      settingsId = existing.id;
      previousLogoUrl = existing.logoUrl;
      await db.settings.update({
        where: { id: existing.id },
        data: { logoUrl: url },
      });
      return;
    }

    const created = await db.settings.create({
      data: { logoUrl: url },
      select: { id: true },
    });
    settingsId = created.id;
    createdSettings = true;
  }

  async function createLegacyAttachment(
    attachment: RemoteAttachment,
  ): Promise<{ messageId: string; legacyId: string }> {
    const account = await db.emailAccount.create({
      data: {
        name: "Sweep mailbox",
        email: `sweep-mailbox-${randomUUID()}@example.test`,
      },
    });
    emailAccountIds.push(account.id);

    const conversation = await db.conversation.create({
      data: {
        contactEmail: "contact@example.test",
        emailAccountId: account.id,
      },
    });

    const message = await db.emailMessage.create({
      data: {
        conversationId: conversation.id,
        direction: EmailMessageDirection.INBOUND,
        fromAddress: "contact@example.test",
        toAddresses: ["owner@example.test"],
        ccAddresses: [],
        bccAddresses: [],
      },
    });

    await db.attachment.create({
      data: {
        emailMessageId: message.id,
        filename: "report.pdf",
        storedFileId: attachment.fileId,
      },
    });

    const legacyId = randomUUID();
    await db.$executeRaw`
      INSERT INTO "EmailAttachment" (
        "id", "emailMessageId", "filename", "contentType", "size", "url",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${legacyId}, ${message.id}, 'report.pdf', 'application/pdf', 120,
        ${attachment.providerUrl}, NOW(), NOW()
      )
    `;

    return { messageId: message.id, legacyId };
  }

  interface Fixture {
    media: RemoteMedia;
    attachment: RemoteAttachment;
    pageRootId: string;
    regionVersionId: string;
    postRootId: string;
    productRootId: string;
    adItemId: string;
    submissionId: string;
    userId: string;
    legacy: { messageId: string; legacyId: string };
  }

  async function seedEveryField(): Promise<Fixture> {
    const media = await createRemoteMedia();
    const attachment = await createRemoteAttachment();

    const pageRootId = await createPage({
      content: [
        {
          type: "Image",
          props: { id: "image-1", image: { src: media.providerOriginal } },
        },
        {
          type: "Text",
          props: {
            id: "text-1",
            text: '<a href="https://example.com/about">About us</a>',
          },
        },
      ],
    });

    const regionVersionId = await createRegionVersion({
      content: [
        {
          type: "Image",
          props: { id: "image-2", image: { src: media.providerRendition } },
        },
      ],
    });

    const postRootId = await createPost(
      { html: `<p>Cover</p><img src="${media.providerOriginal}">` },
      {
        type: "doc",
        content: [
          { type: "image", attrs: { src: media.providerOriginal, alt: "Cover" } },
        ],
      },
    );

    const productRootId = await createProduct({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: media.providerOriginal, alt: "Product" },
        },
      ],
    });

    const adItemId = await createAdItem(media.providerOriginal);

    await setLogo(media.providerOriginal);

    const submissionId = await createSubmission({
      upload: [
        {
          storedFileId: attachment.fileId,
          name: "report.pdf",
          url: attachment.providerUrl,
          type: "application/pdf",
        },
      ],
    });

    const userId = await createUser(
      media.providerOriginal,
      media.providerOriginal,
    );

    const legacy = await createLegacyAttachment(attachment);

    return {
      media,
      attachment,
      pageRootId,
      regionVersionId,
      postRootId,
      productRootId,
      adItemId,
      submissionId,
      userId,
      legacy,
    };
  }

  function fieldReport(
    report: Awaited<ReturnType<typeof sweepStorageAddresses>>,
    field: string,
  ) {
    return report.fields.find((entry) => entry.field === field);
  }

  it("rewrites the address in every listed field to the file's canonical address", async () => {
    const fixture = await seedEveryField();
    const { media, attachment } = fixture;

    const filesBefore = await db.storedFile.findMany({
      where: { id: { in: [media.fileId, attachment.fileId] } },
      select: {
        id: true,
        key: true,
        driver: true,
        remoteUrl: true,
        size: true,
        checksum: true,
        kind: true,
      },
      orderBy: { id: "asc" },
    });

    const report = await sweepStorageAddresses();

    expect(report.dryRun).toBe(false);
    expect(report.files).toBe(2);
    expect(report.rows).toBe(10);
    expect(report.rewritten).toBe(10);
    expect(report.unresolved).toBe(0);
    expect(addressSweepExitCode(report)).toBe(0);

    expect(fieldReport(report, "PageVersion.puckData")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });
    expect(fieldReport(report, "SiteRegionVersion.puckData")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });
    expect(fieldReport(report, "PostVersion.tiptapBodyData")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });
    expect(
      fieldReport(report, "ProductVersion.tiptapDescription"),
    ).toMatchObject({ rows: 1, rewritten: 1 });
    expect(fieldReport(report, "AdItem.imageUrl")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });
    expect(fieldReport(report, "Settings.logoUrl")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });
    expect(fieldReport(report, "FormSubmission.data")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });
    expect(fieldReport(report, "User.image")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });
    expect(fieldReport(report, "User.imageUrl")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });
    expect(fieldReport(report, "EmailAttachment.url")).toMatchObject({
      rows: 1,
      rewritten: 1,
    });

    const mediaAfter = await db.media.findUniqueOrThrow({
      where: { id: media.mediaId },
      select: { revision: true, renditions: true },
    });
    expect(mediaAfter.revision).toBe(1);
    expect(mediaRenditionLocations(mediaAfter.renditions)).toEqual([
      {
        key: media.renditionKey,
        width: 720,
        height: 480,
        bytes: 400,
        format: "webp",
        url: media.providerRendition,
      },
    ]);

    // Content gets own-domain rendition addresses, so a later move cannot
    // leave a provider URL inside a page.
    expect(
      decodeMediaManifest(
        parseSrc(media.canonicalUrl).url.searchParams.get(
          MEDIA_MANIFEST_PARAM,
        ),
      )?.renditions,
    ).toEqual([
      { width: 720, format: "webp", url: storedFilePath("MEDIA", media.renditionKey) },
    ]);

    const page = await db.pageVersion.findFirstOrThrow({
      where: { rootId: fixture.pageRootId },
      select: { puckData: true },
    });
    expect(page.puckData).toEqual({
      content: [
        {
          type: "Image",
          props: { id: "image-1", image: { src: media.canonicalUrl } },
        },
        {
          type: "Text",
          props: {
            id: "text-1",
            text: '<a href="https://example.com/about">About us</a>',
          },
        },
      ],
    });

    const region = await db.siteRegionVersion.findUniqueOrThrow({
      where: { id: fixture.regionVersionId },
      select: { puckData: true },
    });
    expect(region.puckData).toEqual({
      content: [
        {
          type: "Image",
          props: {
            id: "image-2",
            image: { src: storedFilePath("MEDIA", media.renditionKey) },
          },
        },
      ],
    });

    const post = await db.postVersion.findFirstOrThrow({
      where: { rootId: fixture.postRootId },
      select: { bodyData: true, tiptapBodyData: true },
    });
    // The legacy body is not content the product renders and is slated for
    // removal, so the sweep leaves its provider address exactly as it was.
    expect(post.bodyData).toEqual({
      html: `<p>Cover</p><img src="${media.providerOriginal}">`,
    });
    expect(post.tiptapBodyData).toEqual({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: media.canonicalUrl, alt: "Cover" },
        },
      ],
    });

    const product = await db.productVersion.findFirstOrThrow({
      where: { rootId: fixture.productRootId },
      select: { tiptapDescription: true },
    });
    expect(product.tiptapDescription).toEqual({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: media.canonicalUrl, alt: "Product" },
        },
      ],
    });

    const adItem = await db.adItem.findUniqueOrThrow({
      where: { id: fixture.adItemId },
      select: { imageUrl: true },
    });
    expect(adItem.imageUrl).toBe(media.canonicalUrl);

    const settings = await db.settings.findUniqueOrThrow({
      where: { id: settingsId! },
      select: { logoUrl: true },
    });
    expect(settings.logoUrl).toBe(media.canonicalUrl);

    const submission = await db.formSubmission.findUniqueOrThrow({
      where: { id: fixture.submissionId },
      select: { data: true },
    });
    expect(submission.data).toEqual({
      upload: [
        {
          storedFileId: attachment.fileId,
          name: "report.pdf",
          url: attachment.canonicalUrl,
          type: "application/pdf",
        },
      ],
    });

    const user = await db.user.findUniqueOrThrow({
      where: { id: fixture.userId },
      select: { image: true, imageUrl: true },
    });
    expect(user).toEqual({
      image: media.canonicalUrl,
      imageUrl: media.canonicalUrl,
    });

    const legacy = await db.$queryRaw<{ url: string }[]>`
      SELECT "url" FROM "EmailAttachment" WHERE "id" = ${fixture.legacy.legacyId}
    `;
    expect(legacy).toEqual([{ url: attachment.canonicalUrl }]);

    // The sweep writes addresses, never locations.
    const filesAfter = await db.storedFile.findMany({
      where: { id: { in: [media.fileId, attachment.fileId] } },
      select: {
        id: true,
        key: true,
        driver: true,
        remoteUrl: true,
        size: true,
        checksum: true,
        kind: true,
      },
      orderBy: { id: "asc" },
    });
    expect(filesAfter).toEqual(filesBefore);

    const audit = await auditMediaLibrary({
      env,
      localRoot: root,
      mediaIds: [media.mediaId],
    });
    expect(audit.unresolved).toEqual([]);
    expect(mediaAuditExitCode(audit)).toBe(0);
  });

  it("reports zero changes on a second run", async () => {
    await seedEveryField();

    await sweepStorageAddresses();

    const snapshot = {
      media: await db.media.findMany({
        where: { id: { in: mediaIds } },
        select: { id: true, revision: true, renditions: true },
        orderBy: { id: "asc" },
      }),
      pages: await db.pageVersion.findMany({
        where: { rootId: { in: pageRootIds } },
        select: { id: true, puckData: true },
        orderBy: { id: "asc" },
      }),
      posts: await db.postVersion.findMany({
        where: { rootId: { in: postRootIds } },
        select: { id: true, bodyData: true, tiptapBodyData: true },
        orderBy: { id: "asc" },
      }),
      products: await db.productVersion.findMany({
        where: { rootId: { in: productRootIds } },
        select: { id: true, tiptapDescription: true },
        orderBy: { id: "asc" },
      }),
    };

    const second = await sweepStorageAddresses();

    expect(second).toMatchObject({
      files: 0,
      rows: 0,
      rewritten: 0,
      unresolved: 0,
    });
    expect(second.fields.every((entry) => entry.rewritten === 0)).toBe(true);

    expect(
      await db.media.findMany({
        where: { id: { in: mediaIds } },
        select: { id: true, revision: true, renditions: true },
        orderBy: { id: "asc" },
      }),
    ).toEqual(snapshot.media);
    expect(
      await db.pageVersion.findMany({
        where: { rootId: { in: pageRootIds } },
        select: { id: true, puckData: true },
        orderBy: { id: "asc" },
      }),
    ).toEqual(snapshot.pages);
    expect(
      await db.postVersion.findMany({
        where: { rootId: { in: postRootIds } },
        select: { id: true, bodyData: true, tiptapBodyData: true },
        orderBy: { id: "asc" },
      }),
    ).toEqual(snapshot.posts);
    expect(
      await db.productVersion.findMany({
        where: { rootId: { in: productRootIds } },
        select: { id: true, tiptapDescription: true },
        orderBy: { id: "asc" },
      }),
    ).toEqual(snapshot.products);
  });

  it("reports what a dry run would change without writing", async () => {
    await seedEveryField();

    const before = {
      media: await db.media.findMany({
        where: { id: { in: mediaIds } },
        select: { id: true, revision: true, renditions: true },
        orderBy: { id: "asc" },
      }),
      pages: await db.pageVersion.findMany({
        where: { rootId: { in: pageRootIds } },
        select: { id: true, puckData: true },
        orderBy: { id: "asc" },
      }),
    };

    const report = await sweepStorageAddresses({ dryRun: true });

    expect(report).toMatchObject({
      dryRun: true,
      files: 2,
      rows: 10,
      rewritten: 10,
      unresolved: 0,
    });

    expect(
      await db.media.findMany({
        where: { id: { in: mediaIds } },
        select: { id: true, revision: true, renditions: true },
        orderBy: { id: "asc" },
      }),
    ).toEqual(before.media);
    expect(
      await db.pageVersion.findMany({
        where: { rootId: { in: pageRootIds } },
        select: { id: true, puckData: true },
        orderBy: { id: "asc" },
      }),
    ).toEqual(before.pages);
  });

  it("resolves the address a rendition was written with", async () => {
    const media = await createRemoteMedia();
    const renditionPath = storedFilePath("MEDIA", media.renditionKey);

    const postRootId = await createPost(
      { html: `<img srcset="${media.providerRendition} 720w">` },
      {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: {
              src: media.providerOriginal,
              srcset: `${media.providerRendition} 720w`,
            },
          },
        ],
      },
    );

    const report = await sweepStorageAddresses();

    expect(report).toMatchObject({
      files: 1,
      rows: 1,
      rewritten: 2,
      unresolved: 0,
    });
    expect(addressSweepExitCode(report)).toBe(0);

    const post = await db.postVersion.findFirstOrThrow({
      where: { rootId: postRootId },
      select: { bodyData: true, tiptapBodyData: true },
    });

    expect(post.bodyData).toEqual({
      html: `<img srcset="${media.providerRendition} 720w">`,
    });
    expect(post.tiptapBodyData).toEqual({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: {
            src: media.canonicalUrl,
            srcset: `${renditionPath} 720w`,
          },
        },
      ],
    });
  });

  it("reports an address it cannot resolve by field and count", async () => {
    await seedEveryField();
    const missingKey = `missing-${randomUUID()}`;
    const missing = providerUrl(missingKey);

    const unresolvedRoot = await db.pageRoot.create({
      data: { slug: `sweep-unresolved-${randomUUID()}` },
    });
    pageRootIds.push(unresolvedRoot.id);
    await db.pageVersion.create({
      data: {
        rootId: unresolvedRoot.id,
        version: 1,
        title: "Unresolved page",
        puckData: {
          content: [
            { type: "Image", props: { image: { src: missing } } },
          ],
        } as PrismaJson.PuckData,
      },
    });

    const unresolvedPost = await db.postRoot.create({
      data: { slug: `sweep-unresolved-post-${randomUUID()}` },
    });
    postRootIds.push(unresolvedPost.id);
    await db.postVersion.create({
      data: {
        rootId: unresolvedPost.id,
        version: 1,
        title: "Unresolved post",
        bodyData: {
          html: `<img src="${missing}"><p>${missing}</p>`,
        } as Prisma.InputJsonValue,
        tiptapBodyData: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "ok" }] }],
        } as PrismaJson.TipTapBodyData,
      },
    });

    const report = await sweepStorageAddresses();

    expect(report.unresolved).toBe(1);
    expect(report.files).toBe(2);
    expect(addressSweepExitCode(report)).toBe(1);

    expect(fieldReport(report, "PageVersion.puckData")).toMatchObject({
      rows: 1,
      rewritten: 1,
      unresolved: 1,
    });

    const output = [
      ...formatAddressSweepReport(report),
      JSON.stringify(report),
    ].join("\n");

    expect(output).toContain("PageVersion.puckData");
    expect(output).toContain("unresolved=1");
    expect(output).not.toContain(missing);
    expect(output).not.toContain(missingKey);
    expect(output).not.toContain(PROVIDER_ORIGIN);

    const page = await db.pageVersion.findFirstOrThrow({
      where: { rootId: unresolvedRoot.id },
      select: { puckData: true },
    });
    expect(page.puckData).toEqual({
      content: [{ type: "Image", props: { image: { src: missing } } }],
    });
  });
});
