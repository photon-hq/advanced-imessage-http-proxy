#!/bin/bash
# Group Chat Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="http://localhost:3000"

# Create a group chat
curl -X POST "$API/groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"members": ["user1@example.com", "user2@example.com"], "name": "My Group", "message": "Hello everyone!"}'

# Rename a group (GROUP_ID should be the id returned from POST /groups, e.g. group:abc123)
curl -X PATCH "$API/groups/GROUP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Group Name"}'

# Set group icon
curl -X POST "$API/groups/GROUP_ID/icon" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/icon.png"

# Remove group icon
curl -X DELETE "$API/groups/GROUP_ID/icon" -H "Authorization: Bearer $TOKEN"

# Send message to group (reuse the same GROUP_ID value, e.g. group:abc123)
curl -X POST "$API/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "GROUP_ID", "text": "Hello group!"}'
