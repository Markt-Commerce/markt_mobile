import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { Intro, Outro } from "./components/Bookends";
import { Caption } from "./components/Caption";
import { Phone, phoneSize } from "./components/Phone";
import { ScreenTrack } from "./components/ScreenTrack";
import { FPS, VideoSpec, beatFrames, introFrames, outroFrames, timing } from "./timeline";

export type MarktVideoProps = { captions: boolean };

export type Layout = {
  screenHeight: number;
  /** Phone centre, px. */
  phoneX: number;
  phoneY: number;
  caption: { left: number; top: number; width: number; height: number; size: number; align: "center" | "left" };
  scale: number; // for bookend type
};

export const CREDITS =
  "Music: “Allada” by Kevin MacLeod (incompetech.com), CC BY 4.0. " +
  "Product photos: Wikimedia Commons contributors, CC0 / CC BY / CC BY-SA (see credits file). " +
  "Demo data; people and shops are fictional.";

const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** Push-in for beats that have a focus, released as the next beat starts. */
const focusAt = (video: VideoSpec, beatStarts: number[], frame: number) => {
  for (let i = 0; i < video.beats.length; i++) {
    const f = video.beats[i].focus;
    const start = beatStarts[i];
    const end = start + beatFrames(video.beats[i]);
    if (!f || frame < start || frame >= end + 12) continue;
    const peak = start + f.at * FPS;
    const scale =
      frame < end
        ? interpolate(frame, [peak - 0.7 * FPS, peak], [1, f.scale], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: easeInOut,
          })
        : interpolate(frame, [end, end + 12], [f.scale, 1], { easing: easeInOut });
    return { scale, originY: f.originY };
  }
  return { scale: 1, originY: 0.5 };
};

export const MarktVideo: React.FC<MarktVideoProps & { layout: Layout; video: VideoSpec }> = ({
  captions,
  layout,
  video,
}) => {
  const frame = useCurrentFrame();
  const { beatStarts, outroStart, totalFrames, musicStartFrom } = timing(video);
  const { fps } = useVideoConfig();
  const { width: pw, height: ph } = phoneSize(layout.screenHeight);

  // Phone rises in as the intro panel lifts.
  const enter = spring({ frame: frame - (introFrames - 14), fps, config: { damping: 22, mass: 0.9 } });
  const focus = focusAt(video, beatStarts, frame);

  const musicVolume = (f: number) =>
    interpolate(f, [0, 12, totalFrames - 40, totalFrames], [0, 0.9, 0.9, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  return (
    <AbsoluteFill>
      <Background />

      {captions &&
        video.beats.map((beat, i) => (
          <Sequence key={beat.id} from={beatStarts[i]} durationInFrames={beatFrames(beat)} layout="none">
            <div
              style={{
                position: "absolute",
                left: layout.caption.left,
                top: layout.caption.top,
                width: layout.caption.width,
                height: layout.caption.height,
                display: "flex",
                alignItems: "center",
                justifyContent: layout.caption.align === "center" ? "center" : "flex-start",
              }}
            >
              <Caption
                lead={beat.caption.lead}
                accent={beat.caption.accent}
                durationInFrames={beatFrames(beat)}
                size={layout.caption.size}
                align={layout.caption.align}
              />
            </div>
          </Sequence>
        ))}

      <div
        style={{
          position: "absolute",
          left: layout.phoneX - pw / 2,
          top: layout.phoneY - ph / 2,
          transform: `translateY(${(1 - enter) * 900}px) scale(${focus.scale})`,
          transformOrigin: `50% ${focus.originY * 100}%`,
        }}
      >
        <Phone screenHeight={layout.screenHeight}>
          <ScreenTrack video={video} />
        </Phone>
      </div>

      <Sequence durationInFrames={introFrames} layout="none">
        <Intro durationInFrames={introFrames} scale={layout.scale} line={video.intro} />
      </Sequence>
      <Sequence from={outroStart} durationInFrames={outroFrames} layout="none">
        <Outro
          scale={layout.scale}
          credits={CREDITS}
          headline={video.outro.headline}
          sub={video.outro.sub}
        />
      </Sequence>

      <Audio src={staticFile("audio/allada.mp3")} trimBefore={musicStartFrom} volume={musicVolume} />
    </AbsoluteFill>
  );
};
