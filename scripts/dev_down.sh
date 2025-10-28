#!/usr/bin/env bash
set -euo pipefail

# Stop frontend and backend started by dev_up.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="$ROOT_DIR/.dev_pids"

if [ -f "$PID_FILE" ]; then
  while IFS='=' read -r name pid; do
    if [ -n "${pid:-}" ] && kill -0 "$pid" >/dev/null 2>&1; then
      echo "Stopping $name (PID $pid)"
      kill "$pid" || true
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
fi

# Fallbacks in case PIDs changed
pkill -f "vite" >/dev/null 2>&1 || true
pkill -f "src/main.py" >/dev/null 2>&1 || true

echo "Dev services stopped."

