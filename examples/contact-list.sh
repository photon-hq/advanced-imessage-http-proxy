#!/bin/bash
# Contacts and Handles Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# Get contacts
curl "$API/contacts" -H "Authorization: Bearer $TOKEN"

# Get handles (addresses you've communicated with)
curl "$API/handles?limit=50" -H "Authorization: Bearer $TOKEN"

# Find My Friends locations
curl "$API/icloud/friends" -H "Authorization: Bearer $TOKEN"
