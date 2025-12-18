#!/bin/bash
# Health check (no authentication required)

API="https://imessage-swagger.photon.codes"

echo "=== Health Check ==="
curl -s "$API/health" | jq .
