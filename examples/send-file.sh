#!/bin/bash
# Send File/Attachment Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# Send an image
curl -X POST "$API/send/file" \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=user@example.com" \
  -F "file=@/path/to/photo.jpg"

# Send a voice message
curl -X POST "$API/send/file" \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=user@example.com" \
  -F "file=@/path/to/audio.m4a" \
  -F "audio=true"

# Send to a group chat
curl -X POST "$API/send/file" \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=group:abc123" \
  -F "file=@/path/to/document.pdf"
