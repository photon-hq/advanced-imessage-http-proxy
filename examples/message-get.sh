#!/bin/bash
# Get a single message by ID

TOKEN="${TOKEN:-YOUR_BASE64_TOKEN}"
API="https://imessage-swagger.photon.codes"

# Replace with actual message GUID
MESSAGE_GUID="${1:-MESSAGE_GUID}"

echo "=== Get Message Details ==="
curl -s "$API/messages/$MESSAGE_GUID" \
  -H "Authorization: Bearer $TOKEN" | jq .
