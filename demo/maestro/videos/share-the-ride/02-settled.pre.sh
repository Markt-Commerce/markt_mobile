#!/usr/bin/env bash
# Between the takes: Mama Bisi accepts the shared orders and the run closes
# and settles -- each share comes out cheaper and the difference goes back to
# the buyer's wallet (scripts/demo_close_shared_run.py).
set -euo pipefail
cd "$MARKT_BACKEND"
docker compose -f docker-compose.demo.yml exec -T -e MARKT_DEMO=1 api \
  python scripts/demo_close_shared_run.py | grep -E "Accepted|Close pass"
