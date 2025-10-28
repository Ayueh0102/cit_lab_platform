#!/usr/bin/env bash
set -euo pipefail

# Start both frontend (Vite) and backend (Flask) in background.
# - Frontend runs on 127.0.0.1:${PORT:-5173}
# - Backend runs on 127.0.0.1:5001

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FE_DIR="$ROOT_DIR/alumni-platform"
BE_DIR="$ROOT_DIR/alumni_platform_api"
LOG_DIR="$ROOT_DIR/.logs"
PID_FILE="$ROOT_DIR/.dev_pids"

mkdir -p "$LOG_DIR"

start_frontend() {
  local port="${PORT:-5173}"
  local log="$LOG_DIR/frontend.log"
  local pm=""

  if command -v pnpm >/dev/null 2>&1; then
    pm="pnpm"
  else
    pm="npm"
  fi

  # Install deps if missing
  if [ ! -d "$FE_DIR/node_modules" ]; then
    if [ "$pm" = "pnpm" ]; then
      (cd "$FE_DIR" && pnpm install)
    else
      (cd "$FE_DIR" && (npm ci || npm install))
    fi
  fi

  # Start Vite with explicit host to avoid bind issues
  if [ "$pm" = "pnpm" ]; then
    (cd "$FE_DIR" && nohup pnpm dev -- --host 127.0.0.1 --port "$port" >"$log" 2>&1 & echo "FRONTEND=$!" >> "$PID_FILE")
  else
    (cd "$FE_DIR" && nohup npm run dev -- --host 127.0.0.1 --port "$port" >"$log" 2>&1 & echo "FRONTEND=$!" >> "$PID_FILE")
  fi
  echo "Frontend: http://127.0.0.1:$port (logs: $log)"
}

start_backend() {
  local log="$LOG_DIR/backend.log"

  # Ensure venv
  if [ ! -d "$BE_DIR/venv" ]; then
    (cd "$BE_DIR" && python3 -m venv venv)
  fi

  # Ensure deps (best-effort)
  (cd "$BE_DIR" && ./venv/bin/pip install -r requirements.txt >/dev/null 2>&1 || true)

  # Start Flask app
  (cd "$BE_DIR" && nohup ./venv/bin/python src/main.py >"$log" 2>&1 & echo "BACKEND=$!" >> "$PID_FILE")
  echo "Backend:  http://127.0.0.1:5001 (logs: $log)"
}

# Reset PID file
: > "$PID_FILE"

start_backend
start_frontend

echo "PIDs saved to $PID_FILE"

