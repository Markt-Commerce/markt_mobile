#!/usr/bin/env bash
# Render videos: vertical + landscape, captioned + clean, then level loudness.
#
#   scripts/render.sh                  # every video
#   scripts/render.sh Communities      # one (the id prefix from src/videos.ts)
#
# Outputs: out/<kebab-id>-vertical.mp4, -vertical-clean, -landscape, -landscape-clean
set -euo pipefail
cd "$(dirname "$0")/.."

ids=$(npx remotion compositions src/index.ts --quiet 2>/dev/null | tr ' ' '\n' | grep -E 'Vertical$' | sed 's/Vertical$//')
[ -n "${1:-}" ] && ids="$1"

kebab() { echo "$1" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'; }

for id in $ids; do
  name=$(kebab "$id")
  for fmt in Vertical Landscape; do
    f=$(echo "$fmt" | tr '[:upper:]' '[:lower:]')
    npx remotion render "${id}${fmt}" "out/${name}-${f}.mp4" --log=error
    npx remotion render "${id}${fmt}" "out/${name}-${f}-clean.mp4" --props='{"captions":false}' --log=error
  done
done
scripts/loudnorm.sh
