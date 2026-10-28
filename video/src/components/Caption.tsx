import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, FONT } from "../theme";

// Two short lines; the second carries the brand colour. Words rise in on a
// stagger and the whole caption eases out before the next one arrives --
// restrained, and always long enough on screen to read.
export const Caption: React.FC<{
  lead: string;
  accent: string;
  durationInFrames: number;
  size: number;
  align: "center" | "left";
}> = ({ lead, accent, durationInFrames, size, align }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const words = [
    ...lead.split(" ").map((w) => ({ w, accent: false })),
    ...accent.split(" ").map((w) => ({ w, accent: true })),
  ];
  const leadCount = lead.split(" ").length;

  const renderWord = (word: { w: string; accent: boolean }, i: number) => {
    const p = spring({ frame: frame - 4 - i * 3, fps, config: { damping: 200, mass: 0.6 } });
    return (
      <span
        key={i}
        style={{
          display: "inline-block",
          marginRight: "0.24em",
          transform: `translateY(${(1 - p) * 0.5}em)`,
          opacity: p,
          color: word.accent ? BRAND.primary : BRAND.ink,
        }}
      >
        {word.w}
      </span>
    );
  };

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1.04,
        textAlign: align,
        opacity: exit,
        transform: `translateY(${(1 - exit) * -16}px)`,
      }}
    >
      <div>{words.slice(0, leadCount).map(renderWord)}</div>
      <div>{words.slice(leadCount).map((w, i) => renderWord(w, i + leadCount))}</div>
    </div>
  );
};
