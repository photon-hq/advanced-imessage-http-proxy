#!/bin/bash
# Send Reaction (Tapback) Example

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="http://localhost:3000"

# Send a reaction
# Types: love, like, dislike, laugh, emphasize, question
curl -X POST "$API/messages/MESSAGE_GUID/react" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "love"}'
