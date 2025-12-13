# Advanced iMessage HTTP Proxy

> A minimal HTTP API proxy for iMessage with multi-server support

[![TypeScript](https://img.shields.io/badge/TypeScript-^5-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Advanced iMessage HTTP Proxy is a RESTful API that proxies requests to Advanced iMessage Kit servers. Perfect for building **web apps**, **automation tools**, and **cross-platform integrations**.

---

## Features

| Feature | Description | Endpoint | Example |
| ------- | ----------- | -------- | ------- |
| [Send Messages](#send-messages) | Send text messages with effects | `POST /send` | [send-message.sh](./examples/send-message.sh) |
| [Send Attachments](#send-attachments) | Send images, files, audio | `POST /send/file` | [send-file.sh](./examples/send-file.sh) |
| [Send Stickers](#send-stickers) | Standalone or attached stickers | `POST /send/sticker` | [send-sticker.sh](./examples/send-sticker.sh) |
| [Unsend Messages](#unsend-messages) | Retract sent messages | `DELETE /messages/:id` | [message-edit.sh](./examples/message-edit.sh) |
| [Send Tapbacks](#send-tapbacks) | React with ❤️ 👍 👎 😂 ‼️ ❓ | `POST /messages/:id/react` | [message-react.sh](./examples/message-react.sh) |
| [Remove Tapbacks](#remove-tapbacks) | Remove reactions | `DELETE /messages/:id/react` | [message-react.sh](./examples/message-react.sh) |
| [Query Messages](#query-messages) | List and filter messages | `GET /messages` | [message-search.sh](./examples/message-search.sh) |
| [Search Messages](#search-messages) | Search by text | `GET /messages/search` | [message-search.sh](./examples/message-search.sh) |
| [Get Message](#get-message) | Get single message details | `GET /messages/:id` | - |
| [Get Chats](#get-chats) | List all conversations | `GET /chats` | [chat-list.sh](./examples/chat-list.sh) |
| [Get Chat](#get-chat) | Get chat details | `GET /chats/:id` | [chat-list.sh](./examples/chat-list.sh) |
| [Chat Messages](#chat-messages) | Get messages from chat | `GET /chats/:id/messages` | [chat-list.sh](./examples/chat-list.sh) |
| [Mark Read/Unread](#mark-readunread) | Update read status | `POST /chats/:id/read` | - |
| [Typing Indicators](#typing-indicators) | Show "typing..." status | `POST /chats/:id/typing` | [chat-typing.sh](./examples/chat-typing.sh) |
| [Create Groups](#create-groups) | Start group chats | `POST /groups` | [group-create.sh](./examples/group-create.sh) |
| [Update Groups](#update-groups) | Rename groups | `PATCH /groups/:id` | [group-create.sh](./examples/group-create.sh) |
| [Group Icons](#group-icons) | Set/remove group icons | `POST /groups/:id/icon` | - |
| [Manage Members](#manage-members) | Add/remove participants | `POST /groups/:id/participants` | - |
| [Create Polls](#create-polls) | Create interactive polls | `POST /polls` | [poll-create.sh](./examples/poll-create.sh) |
| [Get Poll Details](#get-poll-details) | Fetch poll information | `GET /polls/:id` | [poll-create.sh](./examples/poll-create.sh) |
| [Vote on Polls](#vote-on-polls) | Vote or unvote | `POST /polls/:id/vote` | [poll-create.sh](./examples/poll-create.sh) |
| [Add Poll Options](#add-poll-options) | Extend poll choices | `POST /polls/:id/options` | [poll-create.sh](./examples/poll-create.sh) |
| [Download Attachments](#download-attachments) | Get received files | `GET /attachments/:id` | [attachment-download.sh](./examples/attachment-download.sh) |
| [Attachment Info](#attachment-info) | Get file metadata | `GET /attachments/:id/info` | - |
| [Check iMessage](#check-imessage) | Verify contact availability | `GET /check/:address` | [service-check.sh](./examples/service-check.sh) |
| [Get Contacts](#get-contacts) | List device contacts | `GET /contacts` | [contact-list.sh](./examples/contact-list.sh) |
| [Get Handles](#get-handles) | List contact handles | `GET /handles` | [contact-list.sh](./examples/contact-list.sh) |
| [Share Contact Card](#share-contact-card) | Share your info | `POST /chats/:id/contact/share` | - |
| [Contact Share Status](#contact-share-status) | Check if sharing recommended | `GET /chats/:id/contact/status` | - |
| [Server Info](#server-info) | Get server details | `GET /server` | [server-info.sh](./examples/server-info.sh) |
| [Health Check](#health-check) | Basic health check | `GET /health` | - |
| [WebSocket Events](#websocket-events) | Real-time event subscription | `WS /ws` | - |

---

## Quick Start

### Installation

```bash
bun install
bun run src/index.ts
```

Server runs at `http://localhost:3000`. Swagger docs at `http://localhost:3000/swagger`.

### Authentication

Generate a token from your Advanced iMessage Kit server URL and API key:

```bash
TOKEN=$(echo -n "https://your-server.com/|your-api-key" | base64)
```

Add to all requests:
```
Authorization: Bearer $TOKEN
```

### Basic Usage

```bash
# Send a message
curl -X POST http://localhost:3000/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "Hello!"}'

# List chats
curl http://localhost:3000/chats -H "Authorization: Bearer $TOKEN"
```

---

## Address Format

| Type | Format | Example |
| ---- | ------ | ------- |
| Email | Direct use | `user@example.com` |
| Phone | With country code | `+1234567890` |
| Group | `group:` prefix | `group:abc123` |

Group IDs used in URLs (e.g. `/groups/:id`) and request bodies (e.g. `to`) reuse the same `group:abc123` format returned by `POST /groups`.

---

## API Reference

### Send Messages

Send text messages to any contact with optional effects.

```bash
# Simple text
curl -X POST http://localhost:3000/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "Hello!"}'

# With effect
curl -X POST http://localhost:3000/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "🎉", "effect": "confetti"}'

# Reply to message
curl -X POST http://localhost:3000/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "Reply", "replyTo": "MESSAGE_GUID"}'
```

**Available Effects:** confetti, fireworks, balloons, heart, lasers, sparkles

> Example: [send-message.sh](./examples/send-message.sh)

### Send Attachments

Send images, files, or audio messages.

```bash
# Image/file
curl -X POST http://localhost:3000/send/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=user@example.com" \
  -F "file=@photo.jpg"

# Audio message
curl -X POST http://localhost:3000/send/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=user@example.com" \
  -F "file=@audio.m4a" \
  -F "audio=true"
```

> Example: [send-file.sh](./examples/send-file.sh)

### Send Stickers

Send stickers as standalone messages or attach to existing messages.

```bash
# Standalone sticker
curl -X POST http://localhost:3000/send/sticker \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=user@example.com" \
  -F "file=@sticker.png"

# Reply sticker (attach to message bubble)
curl -X POST http://localhost:3000/send/sticker \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=user@example.com" \
  -F "file=@sticker.png" \
  -F "replyTo=MESSAGE_GUID" \
  -F "stickerX=0.5" \
  -F "stickerY=0.5" \
  -F "stickerScale=0.75"
```

**Parameters:**
- `stickerX`, `stickerY`: Position (0-1), default: 0.5 (center)
- `stickerScale`: Scale (0-1), default: 0.75
- `stickerRotation`: Rotation in radians, default: 0
- `stickerWidth`: Width in pixels, default: 300

> Example: [send-sticker.sh](./examples/send-sticker.sh)

### Send Tapbacks

Add or remove reactions to messages.

```bash
# Add reaction (types: love, like, dislike, laugh, emphasize, question)
curl -X POST http://localhost:3000/messages/MESSAGE_GUID/react \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat": "user@example.com", "type": "love"}'

# Remove reaction
curl -X DELETE http://localhost:3000/messages/MESSAGE_GUID/react \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat": "user@example.com", "type": "love"}'
```

> Example: [message-react.sh](./examples/message-react.sh)

### Query Messages

List and search messages.

```bash
# List messages
curl "http://localhost:3000/messages?limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Filter by chat
curl "http://localhost:3000/messages?chat=user@example.com&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Search
curl "http://localhost:3000/messages/search?q=hello" \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [message-search.sh](./examples/message-search.sh)

### Get Chats

List and manage conversations.

```bash
# List chats
curl http://localhost:3000/chats \
  -H "Authorization: Bearer $TOKEN"

# Get chat details
curl http://localhost:3000/chats/user@example.com \
  -H "Authorization: Bearer $TOKEN"

# Get chat messages
curl "http://localhost:3000/chats/user@example.com/messages?limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Mark as read
curl -X POST http://localhost:3000/chats/user@example.com/read \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [chat-list.sh](./examples/chat-list.sh)

### Typing Indicators

Show typing status in chat.

```bash
# Start typing
curl -X POST http://localhost:3000/chats/user@example.com/typing \
  -H "Authorization: Bearer $TOKEN"

# Stop typing
curl -X DELETE http://localhost:3000/chats/user@example.com/typing \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [chat-typing.sh](./examples/chat-typing.sh)

### Create Groups

Create and manage group chats.

```bash
# Create group
curl -X POST http://localhost:3000/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"members": ["a@x.com", "b@x.com"], "name": "My Group"}'

# Rename
curl -X PATCH http://localhost:3000/groups/GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'

# Set icon
curl -X POST http://localhost:3000/groups/GROUP_ID/icon \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@icon.png"

# Add participant
curl -X POST http://localhost:3000/groups/GROUP_ID/participants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"address": "new@example.com"}'

# Remove participant
curl -X DELETE http://localhost:3000/groups/GROUP_ID/participants/user@example.com \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [group-create.sh](./examples/group-create.sh)

### Create Polls

Create and manage interactive polls.

```bash
# Create poll
RESP=$(curl -s -X POST http://localhost:3000/polls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "group:abc", "question": "Lunch?", "options": ["Pizza", "Burger"]}')

POLL_ID=$(echo "$RESP" | jq -r '.data.id')
OPTION_ID=$(echo "$RESP" | jq -r '.data.options[0].id')

# Get poll details
curl http://localhost:3000/polls/$POLL_ID \
  -H "Authorization: Bearer $TOKEN"

# Vote
curl -X POST http://localhost:3000/polls/$POLL_ID/vote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"chat\": \"group:abc\", \"optionId\": \"$OPTION_ID\"}"

# Unvote
curl -X POST http://localhost:3000/polls/$POLL_ID/unvote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"chat\": \"group:abc\", \"optionId\": \"$OPTION_ID\"}"

# Add option
curl -X POST http://localhost:3000/polls/$POLL_ID/options \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat": "group:abc", "text": "Sushi"}'
```

> Example: [poll-create.sh](./examples/poll-create.sh)

### Download Attachments

Download received files and media.

```bash
# Get attachment info
curl http://localhost:3000/attachments/GUID/info \
  -H "Authorization: Bearer $TOKEN"

# Download
curl http://localhost:3000/attachments/GUID \
  -H "Authorization: Bearer $TOKEN" \
  -o file.jpg
```

> Example: [attachment-download.sh](./examples/attachment-download.sh)

### Check iMessage

Verify if a contact uses iMessage.

```bash
curl http://localhost:3000/check/user@example.com \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [service-check.sh](./examples/service-check.sh)

### Get Contacts

List device contacts and handles.

```bash
# Get contacts
curl http://localhost:3000/contacts \
  -H "Authorization: Bearer $TOKEN"

# Get handles
curl http://localhost:3000/handles \
  -H "Authorization: Bearer $TOKEN"

# Share contact card
curl -X POST http://localhost:3000/chats/user@example.com/contact/share \
  -H "Authorization: Bearer $TOKEN"

# Check if sharing recommended
curl http://localhost:3000/chats/user@example.com/contact/status \
  -H "Authorization: Bearer $TOKEN"
```

> ⚠️ **Security Note**: `/contacts` and `/handles` contain real device contact information. Use only in trusted environments.

> Example: [contact-list.sh](./examples/contact-list.sh)

### Server Info

Get server information and statistics.

```bash
# Server info
curl http://localhost:3000/server \
  -H "Authorization: Bearer $TOKEN"

# Health check (no auth required)
curl http://localhost:3000/health
```

> Example: [server-info.sh](./examples/server-info.sh)

---

## WebSocket Events

Subscribe to real-time events:

```javascript
import WebSocket from "ws"

const token = "YOUR_BASE64_TOKEN"
const ws = new WebSocket("ws://localhost:3000/ws", {
  headers: { Authorization: `Bearer ${token}` }
})

ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString())
  console.log(msg.event, msg.data)
})
```

**Event Format:**
```json
{
  "event": "event-name",
  "data": { /* payload */ },
  "timestamp": 1700000000000
}
```

**Supported Events:**
- `new-message` - New message received
- `updated-message` - Message updated
- `message-send-error` - Message send failed
- `typing-indicator` - Typing status changed
- `chat-read-status-changed` - Read status changed
- `group-name-change` - Group renamed
- `participant-added` - Member added
- `participant-removed` - Member removed
- `participant-left` - Member left
- `group-icon-changed` - Icon updated
- `group-icon-removed` - Icon removed
- `new-findmy-location` - Location shared

---

## Response Format

Most JSON API responses follow this format. File download endpoints such as `/attachments/:id` return a raw binary stream instead of this envelope.

```json
// Success
{"ok": true, "data": {...}}

// Error
{"ok": false, "error": {"code": "ERROR_CODE", "message": "..."}}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Invalid or missing authentication
- `CONFIG_ERROR` - Invalid or missing configuration (e.g. `serverUrl` / `apiKey`)
- `VALIDATION_ERROR` - Invalid request parameters
- `UPSTREAM_ERROR` - Upstream iMessage server error
- `INTERNAL_ERROR` - Proxy server error
- `UNKNOWN_ERROR` - Unknown server error

Some endpoints may also return resource-specific error codes such as `POLL_NOT_FOUND`.

---

## Known Limitations

| Feature | Status | Reason |
| ------- | ------ | ------ |
| Group Rename/Icon | ⚠️ | May fail for some groups (permissions/state) |
| Add/Remove Group Members | ⚠️ | May timeout on some systems (upstream limitation) |

---

## Examples

All example scripts are in the [`examples/`](./examples) directory:

- [`send-message.sh`](./examples/send-message.sh) - Send messages
- [`send-file.sh`](./examples/send-file.sh) - Send attachments
- [`send-sticker.sh`](./examples/send-sticker.sh) - Send stickers
- [`message-edit.sh`](./examples/message-edit.sh) - Unsend (retract) messages
- [`message-react.sh`](./examples/message-react.sh) - Tapbacks
- [`message-search.sh`](./examples/message-search.sh) - Search messages
- [`poll-create.sh`](./examples/poll-create.sh) - Create/manage polls
- [`chat-list.sh`](./examples/chat-list.sh) - List chats
- [`chat-typing.sh`](./examples/chat-typing.sh) - Typing indicators
- [`group-create.sh`](./examples/group-create.sh) - Group management
- [`attachment-download.sh`](./examples/attachment-download.sh) - Download files
- [`contact-list.sh`](./examples/contact-list.sh) - List contacts
- [`server-info.sh`](./examples/server-info.sh) - Server info
- [`service-check.sh`](./examples/service-check.sh) - Check iMessage availability

---

## License

MIT
