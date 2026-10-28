import React from "react";
import { Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FPS, Segment, VideoSpec, segmentFrames, timing, XFADE } from "../timeline";

type Placed = { seg: Segment; start: number; frames: number };

// Every segment of every beat on one continuous timeline, so the phone never
// goes blank between beats: each new segment dissolves in over the last one.
const place = (video: VideoSpec): Placed[] => {
  const { beatStarts } = timing(video);
  return video.beats.flatMap((beat, bi) => {
    let at = beatStarts[bi];
    return beat.segments.map((seg) => {
      const p = { seg, start: at, frames: segmentFrames(seg) };
      at += p.frames;
      return p;
    });
  });
};

const Clip: React.FC<{ seg: Segment }> = ({ seg }) => {
  const hold = Math.round((seg.holdBefore ?? 0) * FPS);
  const video = (
    <OffthreadVideo
      src={staticFile(`clips/${seg.clip}.mp4`)}
      trimBefore={Math.round(seg.from * FPS)}
      muted
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
  return (
    <>
      {hold > 0 && (
        <Sequence durationInFrames={hold} layout="none">
          <Freeze frame={0}>{video}</Freeze>
        </Sequence>
      )}
      <Sequence from={hold} layout="none">
        {video}
      </Sequence>
    </>
  );
};

const Fading: React.FC<{ fadeIn: boolean; children: React.ReactNode }> = ({ fadeIn, children }) => {
  const frame = useCurrentFrame();
  const opacity = fadeIn ? interpolate(frame, [0, XFADE], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

export const ScreenTrack: React.FC<{ video: VideoSpec; offset?: number }> = ({
  video,
  offset = 0,
}) => {
  const placed = place(video);
  return (
  <>
    {placed.map((p, i) => {
      const last = i === placed.length - 1;
      // Overlap the previous segment by XFADE frames; the last one holds to the end.
      const from = p.start - offset - (i === 0 ? 0 : XFADE);
      const dur = p.frames + (i === 0 ? 0 : XFADE) + (last ? 10 * FPS : 0);
      return (
        <Sequence key={i} from={from} durationInFrames={dur} layout="none">
          <Fading fadeIn={i !== 0}>
            {/* The hold/trim maths is relative to the segment's own start. */}
            <Sequence from={i === 0 ? 0 : XFADE} layout="none">
              <Clip seg={p.seg} />
            </Sequence>
            {i !== 0 && (
              <Sequence durationInFrames={XFADE} layout="none">
                <Freeze frame={0}>
                  <Clip seg={p.seg} />
                </Freeze>
              </Sequence>
            )}
          </Fading>
        </Sequence>
      );
    })}
  </>
  );
};
