import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../theme";

// Warm paper with two slow, soft orange glows -- enough depth to sit a phone
// on, never enough to compete with the screen.
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (a: number, b: number, period: number) =>
    interpolate(Math.sin((f / period) * Math.PI * 2), [-1, 1], [a, b]);
  return (
    <AbsoluteFill style={{ background: BRAND.paper, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: "120%",
          height: "70%",
          left: `${drift(-30, -10, 900)}%`,
          top: `${drift(-25, -15, 1100)}%`,
          background: `radial-gradient(closest-side, ${BRAND.paperWarm}, rgba(253,237,230,0))`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "110%",
          height: "80%",
          right: `${drift(-40, -25, 1300)}%`,
          bottom: `${drift(-35, -20, 1000)}%`,
          background: "radial-gradient(closest-side, rgba(233,76,42,0.13), rgba(233,76,42,0))",
        }}
      />
    </AbsoluteFill>
  );
};
