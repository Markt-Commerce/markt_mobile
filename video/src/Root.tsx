import React from "react";
import { Composition } from "remotion";
import { Layout, MarktVideo, MarktVideoProps } from "./MarktVideo";
import { FPS, timing } from "./timeline";
import { VIDEOS } from "./videos";

// Reels / TikTok / Shorts: caption above, phone filling the lower two-thirds.
const VERTICAL: Layout = {
  screenHeight: 1300,
  phoneX: 540,
  phoneY: 1225,
  caption: { left: 60, top: 150, width: 960, height: 340, size: 96, align: "center" },
  scale: 1,
};

// YouTube / web: phone left of centre, caption beside it.
const LANDSCAPE: Layout = {
  screenHeight: 900,
  phoneX: 640,
  phoneY: 545,
  caption: { left: 1000, top: 240, width: 820, height: 600, size: 104, align: "left" },
  scale: 0.9,
};

const defaults: MarktVideoProps = { captions: true };

export const Root: React.FC = () => (
  <>
    {VIDEOS.filter((v) => v.beats.length > 0).map((video) => (
      <React.Fragment key={video.id}>
        <Composition
          id={`${video.id}Vertical`}
          component={(p: MarktVideoProps) => <MarktVideo {...p} layout={VERTICAL} video={video} />}
          durationInFrames={timing(video).totalFrames}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={defaults}
        />
        <Composition
          id={`${video.id}Landscape`}
          component={(p: MarktVideoProps) => <MarktVideo {...p} layout={LANDSCAPE} video={video} />}
          durationInFrames={timing(video).totalFrames}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={defaults}
        />
      </React.Fragment>
    ))}
  </>
);
