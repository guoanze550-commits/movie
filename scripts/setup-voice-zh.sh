#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
[[ -x .venv-voice/bin/python ]] || python3 -m venv .venv-voice
.venv-voice/bin/python -m pip install --cache-dir .cache/pip -r requirements-voice-zh.lock
printf 'Chinese voice dependencies installed; run scripts/voice-zh.py using .venv-voice/bin/python. Service access and ASR are separate checks.\n'
