#!/bin/bash
# Chat List and Info Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# List all chats
curl "$API/chats?limit=50" -H "Authorization: Bearer $TOKEN"

# Get a specific chat by email/phone
curl "$API/chats/user@example.com" -H "Authorization: Bearer $TOKEN"

# Get chat messages
curl "$API/chats/user@example.com/messages?limit=50" -H "Authorization: Bearer $TOKEN"

# Mark chat as read
curl -X POST "$API/chats/user@example.com/read" -H "Authorization: Bearer $TOKEN"

# Mark chat as unread
curl -X POST "$API/chats/user@example.com/unread" -H "Authorization: Bearer $TOKEN"
