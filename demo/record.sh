#!/usr/bin/env bash
# Record product-video beats from the iOS simulator, identically every time.
#
#   demo/record.sh marketplace all           # every beat of one video
#   demo/record.sh communities 02-join       # one beat
#   demo/record.sh communities 02-join --no-reseed
#   demo/record.sh list                      # videos and their beats
#
# Flows live in demo/maestro/videos/<video>/. For each beat:
#   1. re-seed the backend, unless <beat>.noreseed exists or --no-reseed
#   2. run <beat>.pre.sh if present (backend steps between takes)
#   3. set the marketing status bar
#   4. run <beat>.setup.yaml unrecorded (sign-in, navigation)
#   5. record <beat>.yaml with simctl, then trim the idle ends
#   raw clips     -> demo/recordings/raw/<video>/<beat>.mp4
#   trimmed clips -> video/public/clips/<video>/<beat>.mp4   (used by Remotion)
#
# Needs: the backend from markt_python/scripts/demo_up.sh, the Release build
# installed on a booted simulator (see VIDEO_PIPELINE.md), maestro, ffmpeg.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$HERE")"
BACKEND="${MARKT_BACKEND:-$REPO/../markt_python}"
VIDEOS="$HERE/maestro/videos"

beats_of() { ls "$VIDEOS/$1" | grep -E '^[0-9]{2}-[^.]+\.yaml$' | sed 's/\.yaml$//'; }

if [ "${1:-}" = list ] || [ -z "${1:-}" ]; then
  for v in $(ls "$VIDEOS"); do echo "$v: $(beats_of "$v" | tr '\n' ' ')"; done
  [ "${1:-}" = list ] && exit 0
  echo "usage: $0 <video> <beat|all> [--no-reseed]" >&2; exit 2
fi

video="$1"; beat_arg="${2:-all}"; force_no_reseed=0
[ "${3:-}" = "--no-reseed" ] && force_no_reseed=1
FLOWS="$VIDEOS/$video"
[ -d "$FLOWS" ] || { echo "no such video: $video ($(ls "$VIDEOS" | tr '\n' ' '))" >&2; exit 2; }
RAW="$HERE/recordings/raw/$video"
CLIPS="$REPO/video/public/clips/$video"
mkdir -p "$RAW" "$CLIPS"

if [ "$beat_arg" = all ]; then beats=$(beats_of "$video"); else beats="$beat_arg"; fi

status_bar() {
  xcrun simctl status_bar booted override --time "9:41" --dataNetwork wifi \
    --wifiMode active --wifiBars 3 --cellularMode active --cellularBars 4 \
    --operatorName "" --batteryState charged --batteryLevel 100
}

for beat in $beats; do
  echo "== $video / $beat"
  [ -f "$FLOWS/$beat.yaml" ] || { echo "no such beat: $beat" >&2; exit 2; }
  if [ "$force_no_reseed" = 0 ] && [ ! -f "$FLOWS/$beat.noreseed" ]; then
    "$BACKEND/scripts/demo_up.sh" >/dev/null
  fi
  if [ -x "$FLOWS/$beat.pre.sh" ]; then
    MARKT_BACKEND="$BACKEND" "$FLOWS/$beat.pre.sh"
  fi
  status_bar
  if [ -f "$FLOWS/$beat.setup.yaml" ]; then
    (cd "$FLOWS" && maestro test "$beat.setup.yaml" >/dev/null) \
      || { echo "setup failed for $beat (cd $FLOWS && maestro test $beat.setup.yaml)" >&2; exit 1; }
  fi

  raw="$RAW/$beat.mp4"
  rm -f "$raw"
  xcrun simctl io booted recordVideo --codec h264 --force "$raw" >/dev/null 2>&1 &
  rec=$!
  sleep 1.5   # recordVideo needs a moment before the first frame lands
  set +e
  (cd "$FLOWS" && maestro test "$beat.yaml" >/dev/null)
  ok=$?
  set -e
  sleep 1.5
  kill -INT "$rec"; wait "$rec" 2>/dev/null || true
  if [ "$ok" != 0 ]; then
    echo "performance failed for $beat (raw kept at $raw)" >&2; exit 1
  fi
  python3 "$HERE/trim_clip.py" "$raw" "$CLIPS/$beat.mp4"
done
xcrun simctl status_bar booted clear
