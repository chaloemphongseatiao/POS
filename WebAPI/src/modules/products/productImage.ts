const DATA_IMAGE_PATTERN = /^data:image\/(png|jpeg|webp);base64,/i;

export function publicProductImageUrl(id: number, imageUrl: string | null, updatedAt?: Date) {
  if (!imageUrl) return null;
  if (!DATA_IMAGE_PATTERN.test(imageUrl)) return imageUrl;
  const version = updatedAt ? `?v=${updatedAt.getTime()}` : "";
  return `/api/products/${id}/image${version}`;
}

export function isProductImagePath(id: number, imageUrl: string | null | undefined) {
  return imageUrl?.startsWith(`/api/products/${id}/image`) ?? false;
}

export function parseDataImage(imageUrl: string) {
  const match = imageUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return null;

  return {
    contentType: `image/${match[1].toLowerCase()}`,
    data: Buffer.from(match[2], "base64"),
  };
}
