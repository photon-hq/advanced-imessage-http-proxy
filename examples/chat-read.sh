#!/bin/bash
# Mark chat as read or unread

TOKEN="${TOKEN:-YOUR_BASE64_TOKEN}"
API="https://imessage-swagger.photon.codes"

# Chat ID (email, phone, or group:xxx)
CHAT="${1:-user@example.com}"

echo "=== Mark Chat as Read ==="
curl -s -X POST "$API/chats/$CHAT/read" \
  -H "Authorization: Bearer $TOKEN" | jq .

# To mark as unread, add ?unread=true
echo ""
echo "=== Mark Chat as Unread ==="
curl -s -X POST "$API/chats/$CHAT/read?unread=true" \
  -H "Authorization: Bearer $TOKEN" | jq .
