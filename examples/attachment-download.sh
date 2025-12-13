#!/bin/bash
# Attachment Download Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="http://localhost:3000"

# Get attachment info
curl "$API/attachments/ATTACHMENT_GUID/info" -H "Authorization: Bearer $TOKEN"

# Download attachment
curl "$API/attachments/ATTACHMENT_GUID" \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_file.jpg
