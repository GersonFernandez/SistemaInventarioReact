#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

HOST="${HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# Activate venv so 'python' resolves to Python 3.14 + project packages.
VENV_ACTIVATE=""
if [[ -f "$ROOT_DIR/.venv/Scripts/activate" ]]; then
  VENV_ACTIVATE="$ROOT_DIR/.venv/Scripts/activate"
elif [[ -f "$BACKEND_DIR/.venv314/Scripts/activate" ]]; then
  VENV_ACTIVATE="$BACKEND_DIR/.venv314/Scripts/activate"
elif [[ -f "$BACKEND_DIR/.venv/Scripts/activate" ]]; then
  VENV_ACTIVATE="$BACKEND_DIR/.venv/Scripts/activate"
fi

if [[ -n "$VENV_ACTIVATE" ]]; then
  source "$VENV_ACTIVATE"
  echo "Entorno virtual activado: $VENV_ACTIVATE"
fi

PYTHON_EXE="$(command -v python || true)"
if [[ -z "$PYTHON_EXE" ]]; then
  echo "No se encontro python en PATH. Activa un entorno virtual o instala Python 3.14."
  exit 1
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Deteniendo backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Usando Python: $(python --version 2>&1) — $(command -v python)"

echo "Iniciando backend en http://$HOST:$BACKEND_PORT ..."
(
  cd "$BACKEND_DIR"
  python manage.py runserver "$BACKEND_PORT"
) &
BACKEND_PID=$!

cd "$ROOT_DIR"
echo "Iniciando frontend en http://$HOST:$FRONTEND_PORT ..."
npm run dev -- --host "$HOST" --port "$FRONTEND_PORT"
