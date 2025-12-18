#!/bin/bash
# Check iMessage Availability Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="https://imessage-swagger.photon.codes"

# Check if an address can receive iMessage
curl "$API/check/user@example.com" -H "Authorization: Bearer $TOKEN"

# Check a phone number
curl "$API/check/+1234567890" -H "Authorization: Bearer $TOKEN"
