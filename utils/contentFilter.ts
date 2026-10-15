/**
 * Objectionable-content filter.
 *
 * App Store Guideline 1.2 requires "a method for filtering objectionable
 * content". The server does no filtering yet, so this is it: user text is
 * checked before it is sent (posts, comments, listings, niches, reviews, chat)
 * and masked when it is shown, which also covers anything that reached the
 * server some other way.
 *
 * Matching is on whole words after folding case, common character swaps
 * (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s) and stretched letters ("fuuuck"),
 * so "class", "assess" or "Scunthorpe" never trip it.
 */

const BLOCKED_TERMS: string[] = [
  // Profanity and sexual insults
  "fuck", "fucker", "fucking", "motherfucker", "fck", "fuk",
  "shit", "bullshit", "bitch", "bitches", "bastard",
  "cunt", "dick", "dickhead", "pussy", "asshole", "arsehole",
  "whore", "slut", "wanker", "twat", "prick",
  // Sexual content
  "porn", "porno", "nudes", "blowjob", "handjob", "cumshot",
  "dildo", "hentai", "onlyfans",
  // Slurs (race, ethnicity, sexuality, disability)
  "nigger", "nigga", "niggas", "chink", "spic", "kike", "wetback",
  "faggot", "fag", "dyke", "tranny", "retard", "retarded",
  // Nigerian Pidgin, Yoruba and Igbo insults
  "ashawo", "olosho", "oloshi", "werey", "weyrey", "omo ale", "ewu",
  "ode", "oloriburuku", "afurugbe", "anuofia", "ofeke",
  // Threats and violence
  "kill you", "kill yourself", "kys", "i will kill", "go and die",
  "rape", "rapist",
];

// "ode" and "ewu" are also ordinary words (a poem; a goat in Igbo markets),
// so they only count when aimed at someone.
const CONTEXT_ONLY = new Set(["ode", "ewu"]);
const CONTEXT_PREFIX = String.raw`(?:you|u|una|ur|your|this|dis|that|dat|na)\s+`;

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s",
};

/** One-for-one character swaps, so indices still line up with the original. */
function fold(text: string): string {
  let out = "";
  for (const ch of text) {
    // A few characters lower-case to two (İ → i̇); leave those as they are
    // rather than shift every index after them.
    const lower = ch.toLowerCase();
    out += lower.length === ch.length ? (LEET[lower] ?? lower) : ch;
  }
  return out;
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "fuck" → f+u+c+k+, so stretched spellings match; spaces become \s+. */
function stretch(term: string) {
  return term
    .split(" ")
    .map((word) => [...word].map((c) => `${escape(c)}+`).join(""))
    .join(String.raw`\s+`);
}

const PATTERN = new RegExp(
  String.raw`\b(?:` +
    BLOCKED_TERMS.map((t) =>
      CONTEXT_ONLY.has(t) ? `${CONTEXT_PREFIX}${stretch(t)}` : stretch(t)
    ).join("|") +
    String.raw`)\b`,
  "gi"
);

export const OBJECTIONABLE_MESSAGE =
  "This contains language that isn't allowed on Markt. Please change it and try again.";

/** Thrown by the service layer; friendlyErrorMessage shows its message as-is. */
export class ObjectionableContentError extends Error {
  constructor() {
    super(OBJECTIONABLE_MESSAGE);
    this.name = "ObjectionableContentError";
  }
}

export function containsObjectionable(text?: string | null): boolean {
  if (!text) return false;
  PATTERN.lastIndex = 0;
  return PATTERN.test(fold(text));
}

/** Throws ObjectionableContentError if any string given is objectionable. */
export function assertCleanContent(...values: (string | null | undefined)[]): void {
  if (values.some((v) => containsObjectionable(v))) throw new ObjectionableContentError();
}

/** Replaces each objectionable match with asterisks, keeping everything else. */
export function maskObjectionable<T extends string | null | undefined>(text: T): T {
  if (!text) return text;
  const folded = fold(text);
  PATTERN.lastIndex = 0;
  if (!PATTERN.test(folded)) return text;
  let out = "";
  let last = 0;
  PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PATTERN.exec(folded)) !== null) {
    out += text.slice(last, m.index) + m[0].replace(/\S/g, "*");
    last = m.index + m[0].length;
  }
  return (out + text.slice(last)) as T;
}
