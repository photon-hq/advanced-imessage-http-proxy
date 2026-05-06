#!/bin/bash
# Find My Friends Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# List everyone currently sharing location with you (cached)
curl "$API/icloud/friends" -H "Authorization: Bearer $TOKEN"

# Force-refresh from Apple, then list
curl "$API/icloud/friends?refresh=true" -H "Authorization: Bearer $TOKEN"

# Get one friend's location (returns null if they're not sharing)
curl "$API/icloud/friends/+14155550123" -H "Authorization: Bearer $TOKEN"

# Quick boolean check: is this contact sharing right now?
curl "$API/icloud/friends/+14155550123/sharing" -H "Authorization: Bearer $TOKEN"
