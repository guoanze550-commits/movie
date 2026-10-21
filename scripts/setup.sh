#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
export npm_config_cache="${npm_config_cache:-$ROOT/.cache/npm}"
export PIP_CACHE_DIR="${PIP_CACHE_DIR:-$ROOT/.cache/pip}"
export UV_CACHE_DIR="${UV_CACHE_DIR:-$ROOT/.cache/uv}"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$ROOT/.cache/ms-playwright}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$ROOT/.cache}"
mkdir -p "$npm_config_cache" "$PIP_CACHE_DIR" "$UV_CACHE_DIR" "$PLAYWRIGHT_BROWSERS_PATH"
node -e 'if(+process.versions.node.split(".")[0]<20)process.exit(1)'
python3 -c 'import sys; assert sys.version_info >= (3,11)'
command -v ffmpeg; command -v ffprobe
git submodule update --init --recursive
EXPECTED=$(cat upstream/COMMIT)
test "$(git -C upstream/lemo-opuscar rev-parse HEAD)" = "$EXPECTED"
cd upstream/lemo-opuscar
npm ci --no-audit --no-fund
if [[ -n ${PLAYWRIGHT_CHROME:-} ]]; then test -x "$PLAYWRIGHT_CHROME"
elif command -v chromium >/dev/null; then export PLAYWRIGHT_CHROME=$(command -v chromium)
else node node_modules/playwright-core/cli.js install chromium-headless-shell; fi
[[ -x .venv/bin/python ]] || python3 -m venv .venv
.venv/bin/python -m pip install -r "$ROOT/requirements-core.lock"
cd "$ROOT"
python3 scripts/catalog.py
npm ci --no-audit --no-fund
printf 'Ready. Run npm test, npm run test:ui, and bash scripts/verify.sh\n'
