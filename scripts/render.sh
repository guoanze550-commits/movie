#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
export LIB="$ROOT/upstream/lemo-opuscar"
export MOVIE_REAL_FFMPEG="${MOVIE_REAL_FFMPEG:-$(command -v ffmpeg)}"
export PATH="$ROOT/scripts/ffmpeg-compat:$PATH"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$ROOT/.cache/ms-playwright}"
export LEMO_COLOR=bt709
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$ROOT/.cache}"
if [[ -z ${PLAYWRIGHT_CHROME:-} ]] && command -v chromium >/dev/null; then export PLAYWRIGHT_CHROME=$(command -v chromium); fi
PROJECT=${1:-fixtures/smoke}
PROFILE=${2:-preview}
FILM=$(python3 "$ROOT/scripts/render-config.py" "$PROJECT" "$PROFILE")
read -r SIZE FPS <<< "$FILM"
DIR=$(realpath "$ROOT/$PROJECT")
mkdir -p "$DIR/out"
exec > >(tee "$DIR/out/build.log") 2>&1
cd "$LIB"
node core/render/events.mjs "$DIR"
read -r LAST STEP <<< "$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1]))["duration"]; print(max(0,d-1/float(sys.argv[2])), max(.2,d/60))' "$DIR/project.json" "$FPS")"
node core/render/still.mjs "$DIR" 0 "$LAST" --range "0:$LAST:$STEP" --size "$SIZE"
node core/render/readcheck.mjs "$DIR" --size "$SIZE"
node core/render/video.mjs "$DIR" --fps "$FPS" --workers 2 --size "$SIZE" --out "$DIR/out/video.mp4"
if [[ -f "$DIR/subtitles.json" ]]; then .venv/bin/python core/render/srt.py "$DIR/subtitles.json" "$DIR/out/subtitles.srt"; fi
.venv/bin/python "$DIR/mix.py"
sh core/render/mux.sh "$DIR/out/video.mp4" "$DIR/out/mix.wav" "$DIR/out/final.mp4" "$FPS" 0
.venv/bin/python "$ROOT/scripts/quality.py" "$DIR" "$SIZE" "$FPS"
