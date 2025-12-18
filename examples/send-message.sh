#!/bin/bash
# Send Message Examples
# Usage: ./send-message.sh

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# Send a text message
curl -X POST "$API/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "Hello!"}'

# Send to a group chat
curl -X POST "$API/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "group:abc123", "text": "Hello group!"}'

# Send with effect (confetti, fireworks, balloons, heart, lasers, sparkles)
curl -X POST "$API/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "Happy Birthday! 🎉", "effect": "confetti"}'

# Reply to a message
curl -X POST "$API/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "This is a reply", "replyTo": "MESSAGE_GUID"}'
