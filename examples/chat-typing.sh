#!/bin/bash
# Typing Indicator Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# Start typing indicator
curl -X POST "$API/chats/user@example.com/typing" -H "Authorization: Bearer $TOKEN"

# Stop typing indicator
curl -X DELETE "$API/chats/user@example.com/typing" -H "Authorization: Bearer $TOKEN"
