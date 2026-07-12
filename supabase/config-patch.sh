#!/usr/bin/env bash
# Raises refresh-token reuse interval so a transient race between the
# proxy (single server-side cookie writer) and a browser refresh does
# not instantly revoke the session. Rotation stays ENABLED (secure).
set -euo pipefail
TOKEN="$(cat ~/.supabase/access-token)"
PROJECT_REF="lyqmsluktqdeytpouyvh"
PATCH_BODY='{"security_refresh_token_reuse_interval":86400}'
echo "Patching $PROJECT_REF auth config..."
curl -sS -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PATCH_BODY" \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('security_refresh_token_reuse_interval =', d.get('security_refresh_token_reuse_interval'))"
