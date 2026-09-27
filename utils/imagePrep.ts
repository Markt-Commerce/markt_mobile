import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import logger from "./logger";

/**
 * The backend rejects images over 5000×5000 px / 10MB and only accepts
 * .jpg/.jpeg/.png/.webp/.gif — modern phone photos routinely break both rules
 * (108MP cameras exceed 5000px; iPhones produce .heic). Downscale anything
 * over MAX_EDGE and re-encode disallowed formats as JPEG before upload.
 */
const MAX_EDGE = 2048;

const ALLOWED_EXT_RE = /\.(jpe?g|png|webp|gif)(\?|#|$)/i;

export async function prepareImageForUpload(input: {
  uri: string;
  width?: number;
  height?: number;
}): Promise<{ uri: string }> {
  try {
    let { width, height } = input;
    const { uri } = input;

    // Probe dimensions when the caller doesn't know them (e.g. chat sends).
    if (!width || !height) {
      const probe = await ImageManipulator.manipulate(uri).renderAsync();
      width = probe.width;
      height = probe.height;
    }

    const oversized = Math.max(width ?? 0, height ?? 0) > MAX_EDGE;
    if (!oversized && ALLOWED_EXT_RE.test(uri)) return { uri };

    const ctx = ImageManipulator.manipulate(uri);
    if (oversized) {
      if ((width ?? 0) >= (height ?? 0)) ctx.resize({ width: MAX_EDGE });
      else ctx.resize({ height: MAX_EDGE });
    }
    const rendered = await ctx.renderAsync();
    const saved = await rendered.saveAsync({
      compress: 0.85,
      format: SaveFormat.JPEG,
    });
    return { uri: saved.uri };
  } catch (e) {
    // Never block the upload on preprocessing — fall back to the original.
    logger.warn("Image preprocessing failed; uploading original", e);
    return { uri: input.uri };
  }
}
