#!/bin/bash
# Share contact card and check share status

TOKEN="${TOKEN:-YOUR_BASE64_TOKEN}"
API="https://imessage-swagger.photon.codes"

# Chat ID (email, phone, or group:xxx)
CHAT="${1:-user@example.com}"

echo "=== Check Contact Share Status ==="
curl -s "$API/chats/$CHAT/contact/status" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "=== Share Contact Card ==="
curl -s -X POST "$API/chats/$CHAT/contact/share" \
  -H "Authorization: Bearer $TOKEN" | jq .
