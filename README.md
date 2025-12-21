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
| [Get Message](#get-message) | Get single message details | `GET /messages/:id` | [message-get.sh](./examples/message-get.sh) |
| [Get Chats](#get-chats) | List all conversations | `GET /chats` | [chat-list.sh](./examples/chat-list.sh) |
| [Get Chat](#get-chat) | Get chat details | `GET /chats/:id` | [chat-list.sh](./examples/chat-list.sh) |
| [Chat Messages](#chat-messages) | Get messages from chat | `GET /chats/:id/messages` | [chat-list.sh](./examples/chat-list.sh) |
| [Mark Read/Unread](#mark-readunread) | Update read status | `POST /chats/:id/read` | [chat-read.sh](./examples/chat-read.sh) |
| [Typing Indicators](#typing-indicators) | Show "typing..." status | `POST /chats/:id/typing` | [chat-typing.sh](./examples/chat-typing.sh) |
| [Create Groups](#create-groups) | Start group chats | `POST /groups` | [group-create.sh](./examples/group-create.sh) |
| [Update Groups](#update-groups) | Rename groups | `PATCH /groups/:id` | [group-create.sh](./examples/group-create.sh) |
| [Create Polls](#create-polls) | Create interactive polls | `POST /polls` | [poll-create.sh](./examples/poll-create.sh) |
| [Get Poll Details](#get-poll-details) | Get poll info and options | `GET /polls/:id` | [poll-get.sh](./examples/poll-get.sh) |
| [Poll Vote](#poll-vote) | Vote on a poll option | `POST /polls/:id/vote` | [poll-vote.sh](./examples/poll-vote.sh) |
| [Poll Unvote](#poll-unvote) | Remove vote from poll | `POST /polls/:id/unvote` | [poll-unvote.sh](./examples/poll-unvote.sh) |
| [Poll Add Options](#poll-add-options) | Add option to existing poll | `POST /polls/:id/options` | [poll-options.sh](./examples/poll-options.sh) |
| [Download Attachments](#download-attachments) | Get received files | `GET /attachments/:id` | [attachment-download.sh](./examples/attachment-download.sh) |
| [Attachment Info](#attachment-info) | Get file metadata | `GET /attachments/:id/info` | [attachment-info.sh](./examples/attachment-info.sh) |
| [Check iMessage](#check-imessage) | Verify contact availability | `GET /check/:address` | [service-check.sh](./examples/service-check.sh) |
| [Get Contacts](#get-contacts) | List device contacts | `GET /contacts` | [contact-list.sh](./examples/contact-list.sh) |
| [Get Handles](#get-handles) | List contact handles | `GET /handles` | [contact-list.sh](./examples/contact-list.sh) |
| [Share Contact Card](#share-contact-card) | Share your info | `POST /chats/:id/contact/share` | [contact-share.sh](./examples/contact-share.sh) |
| [Contact Share Status](#contact-share-status) | Check if sharing recommended | `GET /chats/:id/contact/status` | [contact-share.sh](./examples/contact-share.sh) |
| [Server Info](#server-info) | Get server details | `GET /server` | [server-info.sh](./examples/server-info.sh) |
| [Health Check](#health-check) | Basic health check | `GET /health` | [health-check.sh](./examples/health-check.sh) |
| [Real-time Events](#real-time-events-socketio) | Socket.IO event subscription | Socket.IO | [auto-reply-bot.ts](./examples/auto-reply-bot.ts) |

---

## Quick Start

### Installation

```bash
bun install
bun run src/index.ts
```

Server runs at `http://localhost:3000`. Swagger docs at `http://localhost:3000/swagger`.

> **Note**: The examples below use the centrally hosted endpoint `https://imessage-swagger.photon.codes`. If you're self-hosting, replace with your own URL (e.g., `http://localhost:3000`).

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
curl -X POST https://imessage-swagger.photon.codes/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "Hello!"}'

# List chats
curl https://imessage-swagger.photon.codes/chats -H "Authorization: Bearer $TOKEN"
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
curl -X POST https://imessage-swagger.photon.codes/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "Hello!"}'

# With effect
curl -X POST https://imessage-swagger.photon.codes/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "user@example.com", "text": "🎉", "effect": "confetti"}'

# Reply to message
curl -X POST https://imessage-swagger.photon.codes/send \
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
curl -X POST https://imessage-swagger.photon.codes/send/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=user@example.com" \
  -F "file=@photo.jpg"

# Audio message
curl -X POST https://imessage-swagger.photon.codes/send/file \
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
curl -X POST https://imessage-swagger.photon.codes/send/sticker \
  -H "Authorization: Bearer $TOKEN" \
  -F "to=user@example.com" \
  -F "file=@sticker.png"

# Reply sticker (attach to message bubble)
curl -X POST https://imessage-swagger.photon.codes/send/sticker \
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
curl -X POST https://imessage-swagger.photon.codes/messages/MESSAGE_GUID/react \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat": "user@example.com", "type": "love"}'

# Remove reaction
curl -X DELETE https://imessage-swagger.photon.codes/messages/MESSAGE_GUID/react \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat": "user@example.com", "type": "love"}'
```

> Example: [message-react.sh](./examples/message-react.sh)

### Query Messages

List and search messages.

```bash
# List messages
curl "https://imessage-swagger.photon.codes/messages?limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Filter by chat
curl "https://imessage-swagger.photon.codes/messages?chat=user@example.com&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Search
curl "https://imessage-swagger.photon.codes/messages/search?q=hello" \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [message-search.sh](./examples/message-search.sh)

### Get Chats

List and manage conversations.

```bash
# List chats
curl https://imessage-swagger.photon.codes/chats \
  -H "Authorization: Bearer $TOKEN"

# Get chat details
curl https://imessage-swagger.photon.codes/chats/user@example.com \
  -H "Authorization: Bearer $TOKEN"

# Get chat messages
curl "https://imessage-swagger.photon.codes/chats/user@example.com/messages?limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Mark as read
curl -X POST https://imessage-swagger.photon.codes/chats/user@example.com/read \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [chat-list.sh](./examples/chat-list.sh)

### Typing Indicators

Show typing status in chat.

```bash
# Start typing
curl -X POST https://imessage-swagger.photon.codes/chats/user@example.com/typing \
  -H "Authorization: Bearer $TOKEN"

# Stop typing
curl -X DELETE https://imessage-swagger.photon.codes/chats/user@example.com/typing \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [chat-typing.sh](./examples/chat-typing.sh)

### Create Groups

Create and manage group chats.

```bash
# Create group
curl -X POST https://imessage-swagger.photon.codes/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"members": ["a@x.com", "b@x.com"], "name": "My Group"}'

# Rename
curl -X PATCH https://imessage-swagger.photon.codes/groups/GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'

# Set icon
curl -X POST https://imessage-swagger.photon.codes/groups/GROUP_ID/icon \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@icon.png"
```

> ⚠️ **Note**: Adding/removing group members is currently limited. See [Known Limitations](#known-limitations).

> Example: [group-create.sh](./examples/group-create.sh)

### Create Polls

Create interactive polls.

```bash
# Create poll
RESP=$(curl -s -X POST https://imessage-swagger.photon.codes/polls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "group:abc", "question": "Lunch?", "options": ["Pizza", "Burger"]}')

POLL_ID=$(echo "$RESP" | jq -r '.data.id')
OPTION_ID=$(echo "$RESP" | jq -r '.data.options[0].id')
```

> Example: [poll-create.sh](./examples/poll-create.sh)

### Get Poll Details

Retrieve poll information and options.

```bash
curl https://imessage-swagger.photon.codes/polls/$POLL_ID \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [poll-get.sh](./examples/poll-get.sh)

### Poll Vote

Vote on a poll option.

```bash
curl -X POST https://imessage-swagger.photon.codes/polls/$POLL_ID/vote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"chat\": \"group:abc\", \"optionId\": \"$OPTION_ID\"}"
```

> Example: [poll-vote.sh](./examples/poll-vote.sh)

### Poll Unvote

Remove your vote from a poll option.

```bash
curl -X POST https://imessage-swagger.photon.codes/polls/$POLL_ID/unvote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"chat\": \"group:abc\", \"optionId\": \"$OPTION_ID\"}"
```

> Example: [poll-unvote.sh](./examples/poll-unvote.sh)

### Poll Add Options

Add a new option to an existing poll.

```bash
curl -X POST https://imessage-swagger.photon.codes/polls/$POLL_ID/options \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat": "group:abc", "text": "Sushi"}'
```

> Example: [poll-options.sh](./examples/poll-options.sh)

### Download Attachments

Download received files and media.

```bash
# Get attachment info
curl https://imessage-swagger.photon.codes/attachments/GUID/info \
  -H "Authorization: Bearer $TOKEN"

# Download
curl https://imessage-swagger.photon.codes/attachments/GUID \
  -H "Authorization: Bearer $TOKEN" \
  -o file.jpg
```

> Example: [attachment-download.sh](./examples/attachment-download.sh)

### Check iMessage

Verify if a contact uses iMessage.

```bash
curl https://imessage-swagger.photon.codes/check/user@example.com \
  -H "Authorization: Bearer $TOKEN"
```

> Example: [service-check.sh](./examples/service-check.sh)

### Get Contacts

List device contacts and handles.

```bash
# Get contacts
curl https://imessage-swagger.photon.codes/contacts \
  -H "Authorization: Bearer $TOKEN"

# Get handles
curl https://imessage-swagger.photon.codes/handles \
  -H "Authorization: Bearer $TOKEN"

# Share contact card
curl -X POST https://imessage-swagger.photon.codes/chats/user@example.com/contact/share \
  -H "Authorization: Bearer $TOKEN"

# Check if sharing recommended
curl https://imessage-swagger.photon.codes/chats/user@example.com/contact/status \
  -H "Authorization: Bearer $TOKEN"
```

> ⚠️ **Security Note**: `/contacts` and `/handles` contain real device contact information. Use only in trusted environments.

> Example: [contact-list.sh](./examples/contact-list.sh)

### Server Info

Get server information and statistics.

```bash
# Server info
curl https://imessage-swagger.photon.codes/server \
  -H "Authorization: Bearer $TOKEN"

# Health check (no auth required)
curl https://imessage-swagger.photon.codes/health
```

> Example: [server-info.sh](./examples/server-info.sh)

---

## Real-time Events (Socket.IO)

Subscribe to real-time events via Socket.IO:

```javascript
import { io } from "socket.io-client"

const token = "YOUR_BASE64_TOKEN"
const socket = io("https://imessage-swagger.photon.codes", {
  auth: { token }
})

// New message received
socket.on("new-message", (message) => {
  console.log("New message:", message.text)
  console.log("From:", message.handle?.address)
})

// Message updated (delivered, read, etc.)
socket.on("updated-message", (message) => {
  if (message.dateRead) console.log("Message read")
  else if (message.dateDelivered) console.log("Message delivered")
})

// Send failed
socket.on("message-send-error", (data) => {
  console.error("Send failed:", data)
})

// Other events
socket.on("typing-indicator", (data) => console.log("Typing:", data))
socket.on("chat-read-status-changed", (data) => console.log("Read status:", data))
```

**Supported Events:**
- `new-message` - New message received
- `updated-message` - Message updated (delivered, read, edited)
- `chat-read-status-changed` - Read status changed
- `group-name-change` - Group renamed
- `participant-added` - Member added
- `participant-removed` - Member removed
- `participant-left` - Member left
- `group-icon-changed` - Group icon updated
- `group-icon-removed` - Group icon removed
- `message-send-error` - Message send failed
- `typing-indicator` - Typing status changed
- `new-server` - New server connected
- `incoming-facetime` - Incoming FaceTime call
- `ft-call-status-changed` - FaceTime call status changed
- `hello-world` - Connection test event

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
| Add Group Members | ⚠️ | May timeout on some systems (upstream limitation) |
| Remove Group Members | ❌ | Upstream API compatibility issue - currently not functional |
| Set/Remove Group Icon | ⚠️ | API returns success but icon may not appear (upstream sync issue) |

---

## Examples

All example scripts are in the [`examples/`](./examples) directory:

- [`send-message.sh`](./examples/send-message.sh) - Send messages
- [`send-file.sh`](./examples/send-file.sh) - Send attachments
- [`send-sticker.sh`](./examples/send-sticker.sh) - Send stickers
- [`message-get.sh`](./examples/message-get.sh) - Get message details
- [`message-edit.sh`](./examples/message-edit.sh) - Unsend (retract) messages
- [`message-react.sh`](./examples/message-react.sh) - Tapbacks
- [`message-search.sh`](./examples/message-search.sh) - Search messages
- [`poll-create.sh`](./examples/poll-create.sh) - Create polls
- [`poll-get.sh`](./examples/poll-get.sh) - Get poll details
- [`poll-vote.sh`](./examples/poll-vote.sh) - Vote on poll
- [`poll-unvote.sh`](./examples/poll-unvote.sh) - Remove vote from poll
- [`poll-options.sh`](./examples/poll-options.sh) - Add poll option
- [`chat-list.sh`](./examples/chat-list.sh) - List chats
- [`chat-read.sh`](./examples/chat-read.sh) - Mark read/unread
- [`chat-typing.sh`](./examples/chat-typing.sh) - Typing indicators
- [`group-create.sh`](./examples/group-create.sh) - Group management
- [`attachment-download.sh`](./examples/attachment-download.sh) - Download files
- [`attachment-info.sh`](./examples/attachment-info.sh) - Attachment metadata
- [`contact-list.sh`](./examples/contact-list.sh) - List contacts
- [`contact-share.sh`](./examples/contact-share.sh) - Share contact card
- [`server-info.sh`](./examples/server-info.sh) - Server info
- [`service-check.sh`](./examples/service-check.sh) - Check iMessage availability
- [`health-check.sh`](./examples/health-check.sh) - Health check

---

## License

MIT
