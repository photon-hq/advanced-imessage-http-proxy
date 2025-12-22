#!/bin/bash
# Chat Participants Example

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# Get participants from a group chat
# Replace 'group:abc123' with your actual group ID
curl "$API/chats/group:abc123/participants" -H "Authorization: Bearer $TOKEN"

# Get participants from a 1-on-1 chat (will return single participant)
curl "$API/chats/user@example.com/participants" -H "Authorization: Bearer $TOKEN"
