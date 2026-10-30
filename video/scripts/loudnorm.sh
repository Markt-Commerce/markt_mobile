#!/usr/bin/env bash
# Bring each render to -14 LUFS / -1 dBTP (what Reels, TikTok and Shorts
# normalise to), copying the video stream untouched.
set -euo pipefail
cd "$(dirname "$0")/../out"
for f in *.mp4; do
  case "$f" in *.norm.mp4) continue ;; esac
  ffmpeg -loglevel error -y -i "$f" -c:v copy -af loudnorm=I=-14:TP=-1:LRA=11 -c:a aac -b:a 192k "${f%.mp4}.norm.mp4"
  mv "${f%.mp4}.norm.mp4" "$f"
  echo "$f: $(ffmpeg -hide_banner -i "$f" -af ebur128=framelog=quiet -f null - 2>&1 | grep -m1 'I:' | xargs)"
done
