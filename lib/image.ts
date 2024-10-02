import { MetadataImage } from "../types";
import axios from "axios";
import sharp from "sharp";
import { UTApi, UTFile } from "uploadthing/server";
import { promises as fs } from "fs";
import path from "path";

const utapi = new UTApi({});

type ProcessSingleImage = {
  width: number;
  height: number;
  format: string;
  processedImage: Buffer;
};

type UploadThingPartialData = {
  key: string;
  url: string;
  name: string;
  size: number;
  type: string;
};

export type ProcessImage = {
  original: (ProcessSingleImage & UploadThingPartialData) | null;
  w300: (ProcessSingleImage & UploadThingPartialData) | null;
  w700: (ProcessSingleImage & UploadThingPartialData) | null;
  w1200: (ProcessSingleImage & UploadThingPartialData) | null;
  w300webp: (ProcessSingleImage & UploadThingPartialData) | null;
  w700webp: (ProcessSingleImage & UploadThingPartialData) | null;
  w1200webp: (ProcessSingleImage & UploadThingPartialData) | null;
  placeholder: (ProcessSingleImage & UploadThingPartialData) | null;
};

export const processImage = async (
  imageUrl: string,
  filename: string
): Promise<ProcessImage> => {
  // Scarica l'immagine originale usando Axios
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(response.data);

  const originalMetadata = await sharp(imageBuffer).metadata();
  const w300 = await processSingleImage(imageBuffer, "jpeg", 300, 50);
  const w700 = await processSingleImage(imageBuffer, "jpeg", 700, 50);
  const w1200 = await processSingleImage(imageBuffer, "jpeg", 1200, 50);
  const w300webp = await processSingleImage(imageBuffer, "webp", 300, 50);
  const w700webp = await processSingleImage(imageBuffer, "webp", 700, 50);
  const w1200webp = await processSingleImage(imageBuffer, "webp", 1200, 50);
  const blurPlaceholder = await processSingleImage(imageBuffer, "blur", 10, 50);

  // 4. Carica le varie versioni
  const w300Url =
    w300 &&
    (await uploadToUploadThing([w300.processedImage], `${filename}-w300.jpg`));
  const w700Url =
    w700 &&
    (await uploadToUploadThing([w700.processedImage], `${filename}-w700.jpg`));
  const w1200Url =
    w1200 &&
    (await uploadToUploadThing(
      [w1200.processedImage],
      `${filename}-w1200.jpg`
    ));

  const w300webpUrl =
    w300webp &&
    (await uploadToUploadThing(
      [w300webp.processedImage],
      `${filename}-w300.webp`
    ));
  const w700webpUrl =
    w700webp &&
    (await uploadToUploadThing(
      [w700webp.processedImage],
      `${filename}-w700.webp`
    ));
  const w1200webpUrl =
    w1200webp &&
    (await uploadToUploadThing(
      [w1200webp.processedImage],
      `${filename}-w1200.webp`
    ));

  const blurPlaceholderUrl =
    blurPlaceholder &&
    (await uploadToUploadThing(
      [blurPlaceholder.processedImage],
      `${filename}-placeholder.jpg`
    ));

  return {
    original: originalMetadata
      ? {
          key: "",
          url: "",
          name: "",
          size: 0,
          type: "",
          processedImage: imageBuffer,
          width: originalMetadata.width || 0,
          height: originalMetadata.height || 0,
          format: originalMetadata.format || "jpeg",
        }
      : null,
    w300: w300Url ? { ...w300, ...w300Url } : null,
    w700: w700Url ? { ...w700, ...w700Url } : null,
    w1200: w1200Url ? { ...w1200, ...w1200Url } : null,
    w300webp: w300webpUrl ? { ...w300webp, ...w300webpUrl } : null,
    w700webp: w700webpUrl ? { ...w700webp, ...w700webpUrl } : null,
    w1200webp: w1200webpUrl ? { ...w1200webp, ...w1200webpUrl } : null,
    placeholder: blurPlaceholderUrl
      ? { ...blurPlaceholder, ...blurPlaceholderUrl }
      : null,
  };
};

export type MapImageToMetadata = {
  original: MetadataImage | null;
  webp: {
    resized: MetadataImage[];
  };
  jpeg: {
    resized: MetadataImage[];
  };
  placeholder: MetadataImage | null;
};

export const mapImageToMetadata = (
  mediaKey: string,
  mediaUrl: string,
  processedImages: ProcessImage
): MapImageToMetadata => {
  const result: MapImageToMetadata = {
    original: null,
    webp: { resized: [] },
    jpeg: { resized: [] },
    placeholder: null,
  };

  result.original = processedImages.original
    ? {
        key: mediaKey!,
        url: mediaUrl!,
        width: processedImages.original.width || 0,
        height: processedImages.original.height || 0,
        format: processedImages.original.format || "jpeg",
      }
    : null;

  processedImages.w300 &&
    result.jpeg.resized.push({
      key: processedImages.w300.key,
      url: processedImages.w300.url,
      width: processedImages.w300.width,
      height: processedImages.w300.height,
      format: processedImages.w300.format,
    });

  processedImages.w700 &&
    result.jpeg.resized.push({
      key: processedImages.w700.key,
      url: processedImages.w700.url,
      width: processedImages.w700.width,
      height: processedImages.w700.height,
      format: processedImages.w700.format,
    });
  processedImages.w1200 &&
    result.jpeg.resized.push({
      key: processedImages.w1200.key,
      url: processedImages.w1200.url,
      width: processedImages.w1200.width,
      height: processedImages.w1200.height,
      format: processedImages.w1200.format,
    });

  processedImages.w300webp &&
    result.webp.resized.push({
      key: processedImages.w300webp.key,
      url: processedImages.w300webp.url,
      width: processedImages.w300webp.width,
      height: processedImages.w300webp.height,
      format: processedImages.w300webp.format,
    });
  processedImages.w700webp &&
    result.webp.resized.push({
      key: processedImages.w700webp.key,
      url: processedImages.w700webp.url,
      width: processedImages.w700webp.width,
      height: processedImages.w700webp.height,
      format: processedImages.w700webp.format,
    });
  processedImages.w1200webp &&
    result.webp.resized.push({
      key: processedImages.w1200webp.key,
      url: processedImages.w1200webp.url,
      width: processedImages.w1200webp.width,
      height: processedImages.w1200webp.height,
      format: processedImages.w1200webp.format,
    });
  result.placeholder = processedImages.placeholder
    ? {
        key: processedImages.placeholder.key,
        url: processedImages.placeholder.url,
        width: processedImages.placeholder.width,
        height: processedImages.placeholder.height,
        format: processedImages.placeholder.format,
      }
    : null;

  return result;
};

const processSingleImage = async (
  image: Buffer,
  format: "jpeg" | "webp" | "blur",
  size: number,
  quality: number
): Promise<ProcessSingleImage | null> => {
  let processedImage: Buffer | null = null;

  if (format === "jpeg") {
    processedImage = await sharp(image)
      .resize(size)
      .jpeg({ quality })
      .toBuffer();
  }
  if (format === "webp") {
    processedImage = await sharp(image)
      .resize(size)
      .webp({ quality })
      .toBuffer();
  }
  if (format === "blur") {
    processedImage = await sharp(image)
      .resize(10)
      .blur(5)
      .jpeg({ quality: 50 })
      .toBuffer(); // Placeholder sfocato
  }

  if (processedImage) {
    const metadata = await sharp(processedImage).metadata();
    return {
      processedImage,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || "jpg",
    };
  }

  return null;
};

// 3. Funzione per caricare le versioni generate su UploadThing
const uploadToUploadThing = async (parts: BlobPart[], filename: string) => {
  const file = new UTFile(parts, filename);
  const response = await utapi.uploadFiles(file);

  return response.data; // Restituisci l'URL dell'immagine caricata
};

function bufferToBase64(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function getFileBufferLocal(filepath: string) {
  // filepath is file addess exactly how is used in Image component (/ = public/)
  const realFilepath = path.join(process.cwd(), "public", filepath);
  return fs.readFile(realFilepath);
}

export async function getPlaceholderImage(filepath: string) {
  try {
    const originalBuffer = await getFileBufferLocal(filepath);
    const resizedBuffer = await sharp(originalBuffer).resize(20).toBuffer();
    return {
      src: filepath,
      placeholder: bufferToBase64(resizedBuffer),
    };
  } catch {
    return {
      src: filepath,
      placeholder:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==",
    };
  }
}
