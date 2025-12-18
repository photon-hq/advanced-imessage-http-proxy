#!/bin/bash
# Get attachment metadata/info

TOKEN="${TOKEN:-YOUR_BASE64_TOKEN}"
API="https://imessage-swagger.photon.codes"

# Attachment GUID
ATTACHMENT_GUID="${1:-ATTACHMENT_GUID}"

echo "=== Get Attachment Info ==="
curl -s "$API/attachments/$ATTACHMENT_GUID/info" \
  -H "Authorization: Bearer $TOKEN" | jq .
