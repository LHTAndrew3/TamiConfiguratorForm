#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Errore: file .env.local non trovato in $SCRIPT_DIR"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "Build TAMI Configurator con firma e notarizzazione..."
npm run tauri build
