#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
APPROVAL_FILE="$REPO_ROOT/.git/approval-push"

HEAD=$(git rev-parse HEAD)
echo "$HEAD" > "$APPROVAL_FILE"
echo "✅ Visto bueno de push registrado."
echo "   HEAD: $HEAD"
echo "   Ahora puedes hacer: git push"
