#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
APPROVAL_FILE="$REPO_ROOT/.git/approval-commit"

HASH=$(git diff --cached | sha256sum | awk '{print $1}')

if [ -z "$HASH" ]; then
  echo "⚠️  No hay cambios staged. Agrega archivos con 'git add' primero."
  exit 1
fi

echo "$HASH" > "$APPROVAL_FILE"
echo "✅ Visto bueno de commit registrado."
echo "   Hash: $HASH"
echo "   Ahora puedes hacer: git commit -m \"tipo(scope): descripción en español\""
