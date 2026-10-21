#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$ROOT/.cache/ms-playwright}"
if [[ -z ${PLAYWRIGHT_CHROME:-} ]] && command -v chromium >/dev/null; then export PLAYWRIGHT_CHROME=$(command -v chromium); fi
npm test
npm run test:ui
node tests/render-contract.mjs
upstream/lemo-opuscar/.venv/bin/python scripts/check-fonts.py
node tests/frame-parity.mjs
upstream/lemo-opuscar/.venv/bin/python scripts/frame-parity.py
bash scripts/render.sh fixtures/smoke preview

python3 tests/audio-integrity.py
