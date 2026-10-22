#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
# Deliberate first-review gate: this wrapper only renders the approved task scope.
bash "$ROOT/scripts/render.sh" films/qianli-jiangshan/preview production
