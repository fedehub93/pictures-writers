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

function bufferToBase64(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function getFileBuffer(filepath: string) {
  if (filepath.startsWith("http")) {
    const response = await fetch(filepath);
    if (!response.ok) throw new Error("Errore nel recupero dell'immagine");
    return Buffer.from(await response.arrayBuffer());
  } else {
    const realFilepath = path.join(process.cwd(), "public", filepath);
    return fs.readFile(realFilepath);
  }
}

export async function getPlaceholderImage(filepath: string) {
  try {
    const originalBuffer = await getFileBuffer(filepath);
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
