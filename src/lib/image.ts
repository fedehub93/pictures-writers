import { MetadataImage } from "../types";
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

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

const FALLBACK_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsa2yqBwAFCAICLICSyQAAAABJRU5ErkJggg==";

function bufferToBase64(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function getLocalFileBuffer(filepath: string) {
  const realFilepath = path.join(process.cwd(), "public", filepath);
  return fs.readFile(realFilepath);
}

export async function getPlaceholderImage(filepath: string) {
  if (!filepath || /^https?:\/\//i.test(filepath)) {
    return {
      src: filepath,
      placeholder: FALLBACK_PLACEHOLDER,
    };
  }

  try {
    const originalBuffer = await getLocalFileBuffer(filepath);
    const resizedBuffer = await sharp(originalBuffer).resize(20).toBuffer();
    return {
      src: filepath,
      placeholder: bufferToBase64(resizedBuffer),
    };
  } catch {
    return {
      src: filepath,
      placeholder: FALLBACK_PLACEHOLDER,
    };
  }
}
