import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { BRAND, FONT } from "../theme";

const LOGO_ASPECT = 1784 / 1328;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

const Logo: React.FC<{ width: number; delay?: number }> = ({ width, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.7 } });
  return (
    <Img
      src={staticFile("brand/markt-logo-white.svg")}
      style={{
        width,
        height: width / LOGO_ASPECT,
        opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
        transform: `scale(${interpolate(p, [0, 1], [0.86, 1])})`,
      }}
    />
  );
};

const Line: React.FC<{ text: string; delay: number; size: number; weight?: number; opacity?: number }> = ({
  text,
  delay,
  size,
  weight = 700,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: "-0.02em",
        color: "white",
        opacity: p * opacity,
        transform: `translateY(${(1 - p) * 24}px)`,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
};

/** Orange open: the logo, one line, then the panel lifts away to the app. */
export const Intro: React.FC<{ durationInFrames: number; scale: number; line: string }> = ({
  durationInFrames,
  scale,
  line,
}) => {
  const frame = useCurrentFrame();
  const lift = interpolate(frame, [durationInFrames - 14, durationInFrames], [0, -100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <AbsoluteFill
      style={{
        background: BRAND.primary,
        transform: `translateY(${lift}%)`,
        alignItems: "center",
        justifyContent: "center",
        gap: 36 * scale,
      }}
    >
      <Logo width={360 * scale} />
      <Line text={line} delay={16} size={64 * scale} />
    </AbsoluteFill>
  );
};

/** Orange close: rises over the last screen; logo, promise, credits. */
export const Outro: React.FC<{
  scale: number;
  credits: string;
  headline: string;
  sub: string;
}> = ({ scale, credits, headline, sub }) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 14], [100, 0], {
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <AbsoluteFill
      style={{
        background: BRAND.primary,
        transform: `translateY(${rise}%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 * scale }}>
        <Logo width={330 * scale} delay={10} />
        <Line text={headline} delay={20} size={(headline.length > 16 ? 76 : 92) * scale} weight={800} />
        <Line
          text={sub}
          delay={28}
          size={30 * scale}
          weight={600}
          opacity={0.9}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 46 * scale,
          left: 60 * scale,
          right: 60 * scale,
          fontFamily: FONT,
          fontSize: 21 * scale,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.78)",
          textAlign: "center",
          opacity: interpolate(frame, [24, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {credits}
      </div>
    </AbsoluteFill>
  );
};
