#!/usr/bin/env python3
"""Trim a raw simulator recording to the action, with a little air either side.

simctl starts recording before Maestro's first command lands and keeps going
after its last, so every raw clip opens and closes on a frozen screen. ffmpeg's
freezedetect finds those still stretches; we keep LEAD seconds of stillness
before the first movement and TAIL after the last, then re-encode at a fixed
frame rate (simctl writes variable-frame-rate video, which editors hate).

    demo/trim_clip.py raw.mp4 out.mp4
"""
import re
import subprocess
import sys

LEAD, TAIL, FPS = 0.6, 1.2, 60


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip())


def freezes(path):
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-vf",
                          "freezedetect=n=-55dB:d=0.4", "-map", "0:v", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"freeze_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"freeze_end: ([\d.]+)", log)]
    return starts, ends


def main():
    import os
    import tempfile

    src, dst = sys.argv[1], sys.argv[2]
    # simctl writes variable-frame-rate video: a frame only when the screen
    # changes, so an idle stretch is one frame held for seconds. Normalise to
    # constant frame rate first; then freezes and cut points are on a real
    # timeline and the cut is frame-accurate.
    with tempfile.TemporaryDirectory() as tmp:
        cfr = os.path.join(tmp, "cfr.mp4")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-vf", f"fps={FPS}",
                        "-c:v", "libx264", "-preset", "veryfast", "-crf", "10", "-an", cfr],
                       check=True)
        total = duration(cfr)
        starts, ends = freezes(cfr)
        # Leading freeze: one that starts at ~0. Trailing: one that never ends.
        first_move = ends[0] if starts and starts[0] < 0.05 and ends else 0.0
        last_move = starts[-1] if len(starts) > len(ends) else total
        t0 = max(0.0, first_move - LEAD)
        t1 = min(total, last_move + TAIL)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", cfr, "-ss", f"{t0:.3f}",
                        "-t", f"{t1 - t0:.3f}", "-c:v", "libx264", "-preset", "slow", "-crf", "14",
                        "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", dst],
                       check=True)
    print(f"{dst}: {t0:.2f}s -> {t1:.2f}s ({t1 - t0:.2f}s of {total:.2f}s)")


if __name__ == "__main__":
    main()
