import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function isAllowedImageContentType(contentType: string) {
  return contentType in ALLOWED_CONTENT_TYPES;
}

export async function uploadProductImage(buffer: Buffer, contentType: string) {
  const ext = ALLOWED_CONTENT_TYPES[contentType];
  const blob = await put(`products/${randomUUID()}.${ext}`, buffer, {
    access: "public",
    contentType,
  });
  return blob.url;
}
