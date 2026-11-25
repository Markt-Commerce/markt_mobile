import React from "react";
import { Img } from "remotion";
import { APPLE_BEZEL } from "../theme";

// The recording is an iPhone 17 Pro simulator at 1206x2622 (the Dynamic Island
// is already in the picture). The drawn frame is our own: a titanium edge, a
// thin black bezel and the display's real corner radius (~55pt on 402pt).
export const SCREEN_ASPECT = 1206 / 2622;
const SCREEN_RADIUS = 0.137; // x screen width
const BEZEL = 0.024; // black border, x screen width
const EDGE = 0.012; // titanium rim, x screen width

export const phoneSize = (screenHeight: number) => {
  const sw = screenHeight * SCREEN_ASPECT;
  const pad = sw * (BEZEL + EDGE);
  return { width: sw + pad * 2, height: screenHeight + pad * 2, screenWidth: sw };
};

export const Phone: React.FC<{ screenHeight: number; children: React.ReactNode }> = ({
  screenHeight,
  children,
}) => {
  const { width, height, screenWidth: sw } = phoneSize(screenHeight);
  const edge = sw * EDGE;
  const bezel = sw * BEZEL;
  const screenR = sw * SCREEN_RADIUS;

  const screen = (
    <div
      style={{
        position: "absolute",
        left: edge + bezel,
        top: edge + bezel,
        width: sw,
        height: screenHeight,
        borderRadius: screenR,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {children}
    </div>
  );

  if (APPLE_BEZEL) {
    // Apple's PNG is the whole device with a transparent screen; screen sits under it.
    return (
      <div style={{ position: "relative", width, height }}>
        {screen}
        <Img src={APPLE_BEZEL} style={{ position: "absolute", inset: 0, width, height }} />
      </div>
    );
  }

  const button = (side: "left" | "right", top: number, h: number) => (
    <div
      style={{
        position: "absolute",
        [side]: -edge * 0.9,
        top,
        width: edge * 1.4,
        height: h,
        borderRadius: edge,
        background: "linear-gradient(90deg,#8c8580,#d9d3ce 45%,#7d7671)",
      }}
    />
  );

  return (
    <div style={{ position: "relative", width, height }}>
      {/* soft contact shadow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: screenR + bezel + edge,
          boxShadow:
            "0 60px 120px -30px rgba(80,30,10,0.38), 0 24px 48px -16px rgba(40,15,5,0.28)",
        }}
      />
      {button("left", height * 0.17, height * 0.035)}
      {button("left", height * 0.235, height * 0.065)}
      {button("left", height * 0.315, height * 0.065)}
      {button("right", height * 0.255, height * 0.1)}
      {/* titanium rim */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: screenR + bezel + edge,
          background:
            "linear-gradient(135deg,#e7e1dc 0%,#a39b95 22%,#ece7e3 48%,#8d857f 74%,#d6d0cb 100%)",
        }}
      />
      {/* black bezel */}
      <div
        style={{
          position: "absolute",
          inset: edge,
          borderRadius: screenR + bezel,
          background: "#050505",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      />
      {screen}
      {/* faint glass sheen */}
      <div
        style={{
          position: "absolute",
          left: edge + bezel,
          top: edge + bezel,
          width: sw,
          height: screenHeight,
          borderRadius: screenR,
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
