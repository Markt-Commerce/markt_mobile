/**
 * The Markt mark, reduced to reusable geometry.
 *
 * Derived from the app icon rather than invented: the logo is a market-stall
 * banner — a rectangle with a V notched up into its base — holding a person
 * glyph, with a tick tucked into the "a" of the wordmark.
 *
 * Those three shapes are the whole vocabulary for the app's illustrations.
 * Everything is a path in code: no asset files, nothing traced from a stock
 * library, and it inherits the theme's colours instead of baking in hex.
 *
 * All paths are drawn in a 100 x 130 box so they compose predictably.
 */

export const VIEWBOX = "0 0 100 130";

/**
 * The stall banner. Bottom edge runs left -> up to the centre notch -> right,
 * which is the silhouette that makes the logo read as a market stall rather
 * than a generic card.
 */
export const BANNER =
  "M6 0 H94 A6 6 0 0 1 100 6 V128 L50 100 L0 128 V6 A6 6 0 0 1 6 0 Z";

/** The head. Sits high in the banner, as in the mark. */
export const HEAD_CX = 50;
export const HEAD_CY = 44;
export const HEAD_R = 17;

/**
 * The shoulders: a dome rising from the banner's lower half. Together with the
 * head this is the person glyph from the logo.
 */
export const SHOULDERS = "M18 104 A32 32 0 0 1 82 104 Z";

/** The tick from the wordmark's "a", as a standalone stroke. */
export const TICK = "M28 62 L44 78 L74 44";

/**
 * A location pin built from the same language — the banner's notch inverted
 * into a point, so the map screens look like they belong to the same family
 * rather than borrowing a generic map marker.
 */
export const PIN =
  "M50 6 C29 6 12 23 12 44 C12 72 50 124 50 124 C50 124 88 72 88 44 C88 23 71 6 50 6 Z";
export const PIN_HOLE_CY = 44;
export const PIN_HOLE_R = 15;
