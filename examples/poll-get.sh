#!/bin/bash
# Get poll details by ID

TOKEN="${TOKEN:-YOUR_BASE64_TOKEN}"
API="https://imessage-swagger.photon.codes"

# Replace with actual poll message GUID
POLL_ID="${1:-POLL_MESSAGE_GUID}"

echo "=== Get Poll Details ==="
curl -s "$API/polls/$POLL_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
