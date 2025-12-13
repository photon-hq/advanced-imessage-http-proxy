#!/bin/bash
# Server Info Examples

TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
API="http://localhost:3000"

# Health check (no auth required)
curl "$API/health"

# Server info
curl "$API/server" -H "Authorization: Bearer $TOKEN"

# Message statistics
curl "$API/server/stats" -H "Authorization: Bearer $TOKEN"
