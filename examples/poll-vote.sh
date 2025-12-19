#!/bin/bash
# Vote on a poll option

TOKEN="${TOKEN:-YOUR_BASE64_TOKEN}"
API="${API:-https://imessage-swagger.photon.codes}"

# Replace with actual values
POLL_ID="${1:-POLL_MESSAGE_GUID}"
CHAT="${2:-user@example.com}"
OPTION_ID="${3:-OPTION_UUID}"

echo "=== Vote on Poll ==="
curl -s -X POST "$API/polls/$POLL_ID/vote" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"chat\": \"$CHAT\", \"optionId\": \"$OPTION_ID\"}" | jq .
