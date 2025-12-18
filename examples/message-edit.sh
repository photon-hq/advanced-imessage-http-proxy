#!/bin/bash
# Edit and Unsend Message Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# Edit a message
curl -X PATCH "$API/messages/MESSAGE_GUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Updated message text"}'

# Unsend (retract) a message
curl -X DELETE "$API/messages/MESSAGE_GUID" \
  -H "Authorization: Bearer $TOKEN"
