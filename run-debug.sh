#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

HOST="${HOST:-127.0.0.1}"
BACKEND_DEBUG_PORT="${BACKEND_DEBUG_PORT:-5678}"
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

# Install debugpy if not present
echo "Verificando debugpy..."
python -m pip install debugpy -q || true

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Deteniendo backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Usando Python: $(python --version 2>&1) — $(command -v python)"
echo ""
echo "🐛 MODO DEBUG ACTIVO"
echo "   Backend: http://$HOST:8000 (debugpy escuchando en puerto $BACKEND_DEBUG_PORT)"
echo "   Frontend: http://$HOST:$FRONTEND_PORT"
echo "   VS Code: Presiona F5 para conectar el debugger"
echo ""

echo "Iniciando backend con debugpy en puerto $BACKEND_DEBUG_PORT..."
(
  cd "$BACKEND_DIR"
  python -m debugpy --listen $BACKEND_DEBUG_PORT manage.py runserver 0.0.0.0:8000
) &
BACKEND_PID=$!

# Give backend time to start
sleep 2

cd "$ROOT_DIR"
echo "Iniciando frontend en http://$HOST:$FRONTEND_PORT ..."
npm run dev -- --host "$HOST" --port "$FRONTEND_PORT"
