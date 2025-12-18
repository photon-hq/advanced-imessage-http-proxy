#!/bin/bash

# Example: Send stickers
# Usage: ./send-sticker.sh

SERVER_URL="https://your-server.com"
API_KEY="your-api-key"
TOKEN=$(echo -n "$SERVER_URL|$API_KEY" | base64)

RECIPIENT="user@example.com"
STICKER_FILE="sticker.png"

echo "Send Standalone Sticker"
curl -X POST https://imessage-swagger.photon.codes/send/sticker \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=$RECIPIENT" \
  -F "file=@$STICKER_FILE"

echo -e "\n\nSend Reply Sticker (attach to message)"
MESSAGE_GUID="your-message-guid"
curl -X POST https://imessage-swagger.photon.codes/send/sticker \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=$RECIPIENT" \
  -F "file=@$STICKER_FILE" \
  -F "replyTo=$MESSAGE_GUID" \
  -F "stickerX=0.5" \
  -F "stickerY=0.5" \
  -F "stickerScale=0.75"

