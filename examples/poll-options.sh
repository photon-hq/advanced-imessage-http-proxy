#!/bin/bash
# Add a new option to an existing poll

TOKEN="${TOKEN:-YOUR_BASE64_TOKEN}"
API="${API:-https://imessage-swagger.photon.codes}"

# Replace with actual values
POLL_ID="${1:-POLL_MESSAGE_GUID}"
CHAT="${2:-user@example.com}"
OPTION_TEXT="${3:-New Option}"

echo "=== Add Poll Option ==="
curl -s -X POST "$API/polls/$POLL_ID/options" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"chat\": \"$CHAT\", \"text\": \"$OPTION_TEXT\"}" | jq .
