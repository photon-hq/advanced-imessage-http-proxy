#!/bin/bash
# Search and Query Messages Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# List recent messages
curl "$API/messages?limit=50" -H "Authorization: Bearer $TOKEN"

# List messages from a specific chat
curl "$API/messages?limit=50&chat=user@example.com" -H "Authorization: Bearer $TOKEN"

# Search messages by text
curl "$API/messages/search?q=hello&limit=20" -H "Authorization: Bearer $TOKEN"

# Get a single message by GUID
curl "$API/messages/MESSAGE_GUID" -H "Authorization: Bearer $TOKEN"
