#!/bin/bash
set -euo pipefail

# Complete poll feature test: create -> query -> vote -> unvote -> add option

# Replace these with your actual server URL, API key and target addresses
SERVER_URL="https://your-server.com/"
API_KEY="your-api-key"
TO="user1@example.com"
GROUP_MEMBER="+1234567890"
API="http://localhost:3000"
TOKEN=$(echo -n "$SERVER_URL|$API_KEY" | base64)

require() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing dependency: $1" >&2
    exit 1
  fi
}

require curl
require jq

log() {
  echo -e "\n=== $1 ===" >&2
}

call_api() {
  local method="$1" endpoint="$2" data="${3-}"
  echo -e "\n$method $API$endpoint" >&2
  if [ -z "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      "$API$endpoint"
  else
    echo "$data" | jq . >&2
    curl -s -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API$endpoint"
  fi
}

run_step() {
  local title="$1" method="$2" endpoint="$3" data="${4-}"
  log "$title"
  local resp
  resp=$(call_api "$method" "$endpoint" "$data")
  echo "$resp" | jq . >&2
  local ok
  ok=$(echo "$resp" | jq -r '.ok // "true"')
  if [ "$ok" != "true" ]; then
    echo "Step failed: $title" >&2
    exit 1
  fi
  echo "$resp"
}

main() {
  local resp GROUP_ID POLL_ID OPTION_ID

  run_step "Health Check" GET "/health"

  # 1. Create group for poll
  resp=$(run_step "Create Group" POST "/groups" "{\"members\":[\"$TO\",\"$GROUP_MEMBER\"],\"name\":\"Poll Feature Test Group\"}")
  GROUP_ID=$(echo "$resp" | jq -r '.data.id')
  echo "GROUP_ID=$GROUP_ID" >&2

  # 2. Create poll
  resp=$(run_step "Create Poll" POST "/polls" "{\"to\":\"$GROUP_ID\",\"question\":\"Which option do you prefer?\",\"options\":[\"Option A\",\"Option B\",\"Option C\"]}")
  POLL_ID=$(echo "$resp" | jq -r '.data.id')
  OPTION_ID=$(echo "$resp" | jq -r '.data.options[0].id')
  
  if [ -z "$OPTION_ID" ] || [ "$OPTION_ID" = "null" ]; then
    echo "❌ Poll creation failed: no optionId returned" >&2
    exit 1
  fi
  
  echo "✅ Poll created successfully!" >&2
  echo "POLL_ID=$POLL_ID" >&2
  echo "OPTION_ID=$OPTION_ID" >&2

  # 3. Query poll details
  resp=$(run_step "Query Poll Details" GET "/polls/$POLL_ID")
  echo "✅ Poll query successful!" >&2

  # 4. Vote
  run_step "Vote for Option A" POST "/polls/$POLL_ID/vote" "{\"chat\":\"$GROUP_ID\",\"optionId\":\"$OPTION_ID\"}"
  echo "✅ Vote successful!" >&2

  # 5. Unvote
  run_step "Unvote" POST "/polls/$POLL_ID/unvote" "{\"chat\":\"$GROUP_ID\",\"optionId\":\"$OPTION_ID\"}"
  echo "✅ Unvote successful!" >&2

  # 6. Add new option
  run_step "Add New Option" POST "/polls/$POLL_ID/options" "{\"chat\":\"$GROUP_ID\",\"text\":\"Option D (New)\"}"
  echo "✅ Option added successfully!" >&2

  echo -e "\n🎉 All poll features tested successfully!" >&2
  echo "Test items:" >&2
  echo "  ✅ Create poll with optionId" >&2
  echo "  ✅ Query poll details" >&2
  echo "  ✅ Vote" >&2
  echo "  ✅ Unvote" >&2
  echo "  ✅ Add new option" >&2
}

main "$@"
