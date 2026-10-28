#!/usr/bin/env bash
# A shared run needs company that has not travelled yet: the neighbours'
# orders from a previous take are already in a closed run, and a run of one
# saves nothing. Start this story from a fresh database every time.
set -euo pipefail
"$MARKT_BACKEND/scripts/demo_up.sh" --fresh >/dev/null
