#!/usr/bin/env bash
# Build the official, commit-pinned FFmpeg used by the verified native pipeline.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SHA=3a0867c2bfda4a4d4309ca1a8cbdc6175e67f587
PREFIX="$ROOT/.cache/ffmpeg"
if [[ -x "$PREFIX/bin/ffmpeg" ]] && [[ -f "$PREFIX/COMMIT" ]] && [[ $(cat "$PREFIX/COMMIT") == "$SHA" ]]; then
  "$PREFIX/bin/ffmpeg" -version | head -1
else
  command -v cc; command -v make; command -v pkg-config
  pkg-config --exists x264 || { echo 'Install libx264-dev before building FFmpeg' >&2; exit 1; }
  SRC="$ROOT/.cache/ffmpeg-source"
  if [[ ! -d "$SRC/.git" ]]; then git clone --depth 1 --branch n7.1.5 https://github.com/FFmpeg/FFmpeg.git "$SRC"; fi
  test "$(git -C "$SRC" rev-parse HEAD)" = "$SHA"
  cd "$SRC"
  ./configure --prefix="$PREFIX" --disable-debug --disable-doc --disable-ffplay --disable-x86asm --disable-autodetect --enable-gpl --enable-libx264
  JOBS=${MOVIE_BUILD_JOBS:-$(nproc)}
  (( JOBS <= 4 )) || JOBS=4
  make -j"$JOBS"
  make install
  printf '%s\n' "$SHA" > "$PREFIX/COMMIT"
fi
"$PREFIX/bin/ffmpeg" -version | head -1
"$PREFIX/bin/ffprobe" -version | head -1
if [[ -n ${GITHUB_PATH:-} ]]; then printf '%s\n' "$PREFIX/bin" >> "$GITHUB_PATH"; fi
printf 'FFmpeg binaries: %s/bin\n' "$PREFIX"
