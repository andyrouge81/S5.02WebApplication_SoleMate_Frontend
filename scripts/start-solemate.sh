#!/usr/bin/env bash
set -euo pipefail

# Script de arranque local para SoleMate (backend + frontend)
# Ubicación esperada:
#   /Users/andy/ItAcademy/soleMate-frontEnd/scripts/start-solemate.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACK_DIR="${BACK_DIR:-$ROOT_DIR/../S5.t02SoleMate}"
FRONT_DIR="${FRONT_DIR:-$ROOT_DIR}"
BACK_PORT="${BACK_PORT:-8080}"
FRONT_PORT="${FRONT_PORT:-3000}"

cleanup() {
  echo ""
  echo "[solemate] Parando backend y frontend..."
  kill 0 >/dev/null 2>&1 || true
}
trap cleanup INT TERM EXIT

echo "[solemate] Frontend: $FRONT_DIR"
echo "[solemate] Backend : $BACK_DIR"

if [[ ! -d "$BACK_DIR" ]]; then
  echo "[solemate] ERROR: no existe el backend en $BACK_DIR"
  exit 1
fi

if [[ ! -f "$BACK_DIR/mvnw" ]]; then
  echo "[solemate] ERROR: no se encontró mvnw en $BACK_DIR"
  exit 1
fi

if [[ ! -f "$FRONT_DIR/package.json" ]]; then
  echo "[solemate] ERROR: no se encontró package.json en $FRONT_DIR"
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "[solemate] ERROR: java no está disponible en PATH"
  exit 1
fi

echo "[solemate] Java activa: $(java -version 2>&1 | head -n 1)"
echo "[solemate] Arrancando backend en :$BACK_PORT ..."
(cd "$BACK_DIR" && ./mvnw spring-boot:run) &
BACK_PID=$!

echo "[solemate] Arrancando frontend en :$FRONT_PORT ..."
(cd "$FRONT_DIR" && npm run dev) &
FRONT_PID=$!

echo "[solemate] Procesos lanzados. Backend PID=$BACK_PID, Frontend PID=$FRONT_PID"
echo "[solemate] URLs esperadas:"
echo "  - Backend  : http://localhost:$BACK_PORT"
echo "  - Frontend : http://localhost:$FRONT_PORT"
echo "[solemate] Pulsa Ctrl+C para parar ambos."

wait "$BACK_PID" "$FRONT_PID"
