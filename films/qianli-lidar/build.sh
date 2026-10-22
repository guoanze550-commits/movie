#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
# Only the seven-second visual test exists. Full 45s film is not authorized.
if [[ ${1:-} == --data ]]; then "$ROOT/upstream/lemo-opuscar/.venv/bin/python" "$ROOT/films/qianli-lidar/tools/build-data.py"; fi
bash "$ROOT/scripts/render.sh" films/qianli-lidar production
