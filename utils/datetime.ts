/**
 * Server time in, Nigerian time out.
 *
 * Two separate problems, which is why this file exists rather than a one-line
 * helper:
 *
 * 1. **The parse was wrong.** The API stores and sends UTC, but most of its
 *    timestamps carry no zone designator — `"2026-09-12T09:27:00"`, the shape
 *    Python's `datetime.utcnow().isoformat()` produces. ECMAScript parses a
 *    date-*time* with no offset as **local** time (a date-only string is UTC —
 *    the two halves of the same format disagree), so on a WAT phone every one
 *    of those arrived an hour early: something posted a minute ago read as
 *    "1 hour ago", and a deadline 30 minutes out read as already closed.
 *    `parseServerDate` fixes the reading by assuming UTC when the string does
 *    not say otherwise.
 *
 * 2. **The display zone was whatever the phone said.** Markt is a Nigerian
 *    marketplace: an order placed at 09:27 in Lagos should read 09:27 to the
 *    buyer, the seller, and the same seller answering from abroad. So
 *    formatting here is pinned to WAT rather than to the device.
 *
 * WAT is UTC+1 with no daylight saving — Nigeria has never observed it — so
 * the shift is a constant. That is deliberate: `Intl` with a `timeZone` option
 * is only as good as the ICU data in the JS engine, and Hermes' coverage
 * differs by platform. A fixed offset needs no ICU, behaves identically on
 * both platforms, and cannot silently fall back to the device zone.
 */

/** West Africa Time: UTC+1, all year, every year. */
const WAT_OFFSET_MINUTES = 60;
const MS_PER_MINUTE = 60_000;

/** Trailing `Z`, `+01:00` or `+0100` — anything that pins the string to a zone. */
const HAS_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** A bare `YYYY-MM-DDTHH:MM[:SS[.sss]]`, which is the shape the API sends. */
const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

/**
 * Parse a timestamp from the API into a real instant.
 *
 * Returns null rather than an Invalid Date, so callers have one thing to check
 * and cannot accidentally render "NaN" or "Invalid Date".
 */
export function parseServerDate(
  value: string | number | Date | null | undefined
): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  const raw = value.trim();
  if (!raw) return null;

  // The only case that needs help: a naive date-time, which is UTC by the
  // API's own contract. Everything else — offsets, `Z`, date-only, RFC 1123 —
  // is already unambiguous and is left exactly as the engine reads it.
  const normalised =
    NAIVE_DATETIME.test(raw) && !HAS_ZONE.test(raw)
      ? `${raw.replace(" ", "T")}Z`
      : raw;

  const d = new Date(normalised);
  return isNaN(d.getTime()) ? null : d;
}

/** The wall-clock fields of an instant, as they read in Lagos. */
function watParts(date: Date) {
  const shifted = new Date(date.getTime() + WAT_OFFSET_MINUTES * MS_PER_MINUTE);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS_LONG = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];

/** "9:27 am". Lower-case because it sits inside sentences and next to numbers. */
export function formatTime(value: string | number | Date | null | undefined): string {
  const d = parseServerDate(value);
  if (!d) return "";
  const { hour, minute } = watParts(d);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "am" : "pm"}`;
}

/**
 * "12 Sep", or "12 Sep 2025" once it is not this year — a year on everything
 * is noise, and a year on nothing is a lie every January.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  opts: { withYear?: boolean | "auto" } = {}
): string {
  const d = parseServerDate(value);
  if (!d) return "";
  const { year, month, day } = watParts(d);
  const withYear = opts.withYear ?? "auto";
  const show =
    withYear === "auto" ? year !== watParts(new Date()).year : withYear;
  return `${day} ${MONTHS[month]}${show ? ` ${year}` : ""}`;
}

/** "Sep" — a chart axis label, where the year and day are already implied. */
export function formatMonthShort(value: string | number | Date | null | undefined): string {
  const d = parseServerDate(value);
  return d ? MONTHS[watParts(d).month] : "";
}

/** "September 2025" — for the coarse "member since" line on a profile. */
export function formatMonthYear(value: string | number | Date | null | undefined): string {
  const d = parseServerDate(value);
  if (!d) return "";
  const { year, month } = watParts(d);
  return `${MONTHS_LONG[month]} ${year}`;
}

/** "12 Sep, 9:27 am" — a date and a time, in that order, in one string. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  opts: { withYear?: boolean | "auto" } = {}
): string {
  const d = parseServerDate(value);
  if (!d) return "";
  return `${formatDate(d, opts)}, ${formatTime(d)}`;
}

/**
 * The label above a group of messages: "Today", "Yesterday", then a date.
 * Day boundaries are Lagos midnights, not the device's.
 */
export function formatDayLabel(value: string | number | Date | null | undefined): string {
  const d = parseServerDate(value);
  if (!d) return "";
  const then = watParts(d);
  const now = watParts(new Date());
  const dayNumber = (p: { year: number; month: number; day: number }) =>
    Date.UTC(p.year, p.month, p.day) / 86_400_000;
  const delta = dayNumber(now) - dayNumber(then);
  if (delta === 0) return "Today";
  if (delta === 1) return "Yesterday";
  if (delta > 1 && delta < 7) return DAYS[then.weekday];
  return formatDate(d);
}

/** Whether two instants land on the same Lagos calendar day. */
export function isSameWatDay(
  a: string | number | Date | null | undefined,
  b: string | number | Date | null | undefined
): boolean {
  const da = parseServerDate(a);
  const db = parseServerDate(b);
  if (!da || !db) return false;
  const pa = watParts(da);
  const pb = watParts(db);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/**
 * Milliseconds from now until an instant — negative once it is past.
 * Every "3 days left" / "Closed" calculation should go through this, because
 * each one of them was doing `new Date(x).getTime() - Date.now()` on a string
 * the engine had already misread by an hour.
 */
export function msUntil(value: string | number | Date | null | undefined): number | null {
  const d = parseServerDate(value);
  return d ? d.getTime() - Date.now() : null;
}

/** Whether a deadline has passed. Null/invalid is treated as "not expired". */
export function hasPassed(value: string | number | Date | null | undefined): boolean {
  const ms = msUntil(value);
  return ms !== null && ms <= 0;
}
