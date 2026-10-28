// Timing maths for a video spec (see videos.ts for the specs themselves).
//
// Clips are the trimmed simulator recordings in public/clips/<video>/ (made
// by demo/record.sh). A beat cuts one or more segments from them and shows
// them in the phone, under one caption. Times are seconds within the clip.

export const FPS = 30;

export type Segment = {
  /** "<video>/<beat>" under public/clips/, without .mp4 */
  clip: string;
  from: number;
  to: number;
  /** Hold this segment's first frame for this long before it plays. */
  holdBefore?: number;
};

/** Gentle push-in on the phone: `scale` reached by `at` (seconds into the beat). */
export type Focus = { at: number; scale: number; originY: number };

export type Beat = {
  id: string;
  caption: { lead: string; accent: string };
  segments: Segment[];
  focus?: Focus;
};

export type VideoSpec = {
  /** Composition id prefix, e.g. "Marketplace" -> MarketplaceVertical. */
  id: string;
  intro: string;
  outro: { headline: string; sub: string };
  beats: Beat[];
  /** A moment in the music track where a phrase ends; it lands on the end card. */
  musicDrop: number;
};

export const INTRO_SECONDS = 2.6;
export const OUTRO_SECONDS = 3.6;

/** Cross-dissolve between consecutive segments, in frames. */
export const XFADE = 6;

export const segmentFrames = (s: Segment) =>
  Math.round(((s.holdBefore ?? 0) + (s.to - s.from)) * FPS);

export const beatFrames = (b: Beat) =>
  b.segments.reduce((sum, s) => sum + segmentFrames(s), 0);

export const introFrames = Math.round(INTRO_SECONDS * FPS);
export const outroFrames = Math.round(OUTRO_SECONDS * FPS);

export type Timing = {
  beatStarts: number[];
  outroStart: number;
  totalFrames: number;
  musicStartFrom: number;
};

export const timing = (v: VideoSpec): Timing => {
  const beatStarts = v.beats.reduce<number[]>((acc, b, i) => {
    acc.push(i === 0 ? introFrames : acc[i - 1] + beatFrames(v.beats[i - 1]));
    return acc;
  }, []);
  const last = v.beats.length - 1;
  const outroStart =
    last < 0 ? introFrames : beatStarts[last] + beatFrames(v.beats[last]);
  return {
    beatStarts,
    outroStart,
    totalFrames: outroStart + outroFrames,
    // Start the track so its phrase ending lands half a second into the end card.
    musicStartFrom: Math.max(
      0,
      Math.round((v.musicDrop - (outroStart / FPS + 0.5)) * FPS)
    ),
  };
};
