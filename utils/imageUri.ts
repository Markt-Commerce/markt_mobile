/** Pick the first valid http(s) URL from media fields (avoids RN "URI parsing error"). */
export function resolveMediaUri(
  media?: { original_url?: string; mobile_url?: string; thumbnail_url?: string } | null
): string | null {
  if (!media) return null;
  for (const u of [media.mobile_url, media.original_url, media.thumbnail_url]) {
    if (typeof u === "string" && /^https?:\/\//i.test(u.trim())) {
      return u.trim();
    }
  }
  return null;
}

/** Strip CSS `url("...")` wrappers sometimes stored in API payloads. */
export function normalizeUri(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  let u = raw.trim();
  const cssMatch = u.match(/^url\(["']?(.+?)["']?\)$/i);
  if (cssMatch) u = cssMatch[1];
  return /^https?:\/\//i.test(u) ? u : null;
}

type ProductImageSource = {
  images?: Array<{
    url?: string | null;
    media?: { original_url?: string; mobile_url?: string; thumbnail_url?: string } | null;
  }> | null;
  image_url?: string | null;
  image?: string | null;
};

/** Resolve product thumbnail from list/detail payloads or chat `message_data.product` snapshots. */
export function resolveProductImageUri(product?: ProductImageSource | null): string | null {
  if (!product) return null;
  const fromMedia = resolveMediaUri(product.images?.[0]?.media ?? undefined);
  if (fromMedia) return fromMedia;
  const fromFields = normalizeUri(product.image_url ?? product.image);
  if (fromFields) return fromFields;
  return normalizeUri(product.images?.[0]?.url);
}
