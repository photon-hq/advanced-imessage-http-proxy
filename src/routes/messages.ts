/**
 * Message Routes
 */
import { t } from "elysia"
import { createHandler, withSdk, toChatGuid, fromChatGuid } from "../core/auth"
import { withTempFile } from "../core/upload"

export function setupMessageRoutes(app: any): void {
    // POST /send - Send message
    app.post("/send", createHandler(async (auth, { body }) => {
        const { to, text, subject, effect, replyTo, service } = body
        const chatGuid = toChatGuid(to, service)
        const effectId = effect ? `com.apple.messages.effect.CK${effect.charAt(0).toUpperCase() + effect.slice(1)}Effect` : undefined

        const result: any = await withSdk(auth, sdk => sdk.messages.sendMessage({
            chatGuid, message: text, subject, effectId, selectedMessageGuid: replyTo,
        }))

        return { ok: true, data: { id: result.guid, to: fromChatGuid(chatGuid), text: result.text, sentAt: result.dateCreated } }
    }), {
        body: t.Object({
            to: t.String({ minLength: 1, maxLength: 256, description: "Who to send to: phone (+1234567890), email, or group ID (group:chat123456)" }),
            text: t.String({ minLength: 1, maxLength: 10000, description: "Your message" }),
            subject: t.Optional(t.String({ maxLength: 256, description: "Subject line (shown in bold above the message)" })),
            effect: t.Optional(t.Union([
                t.Literal("confetti"),
                t.Literal("fireworks"),
                t.Literal("balloon"),
                t.Literal("heart"),
                t.Literal("sparkles"),
                t.Literal("echo"),
                t.Literal("spotlight"),
            ], { description: "Full-screen animation when recipient opens the message" })),
            replyTo: t.Optional(t.String({ maxLength: 128, description: "Reply to a specific message (paste its ID here)" })),
            service: t.Optional(t.Union([
                t.Literal("iMessage"),
                t.Literal("SMS"),
            ], { description: "Force message type: iMessage (blue) or SMS (green). If not specified, server decides." })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                id: t.String(),
                to: t.String(),
                text: t.String(),
                sentAt: t.Number(),
            }),
        }),
        detail: {
            tags: ["Messages"],
            summary: "Send a text message",
            description: "Send a text message through the configured iMessage server. Supports screen effects, replies, and subject lines. Use 'service' to force SMS or iMessage.",
        },
    })

    // POST /send/file - Send file
    app.post("/send/file", createHandler(async (auth, { body }) => {
        const { to, file, audio, service } = body
        const chatGuid = toChatGuid(to, service)

        const result: any = await withSdk(auth, sdk =>
            withTempFile(file, path => sdk.attachments.sendAttachment({
                chatGuid, filePath: path, isAudioMessage: audio === true || audio === "true",
            }))
        )

        return {
            ok: true,
            data: {
                id: result.guid,
                to: fromChatGuid(chatGuid),
                attachments: result.attachments?.map((a: any) => ({ id: a.guid, name: a.transferName, size: a.totalBytes, type: a.mimeType })),
            }
        }
    }), {
        body: t.Object({
            to: t.String({ minLength: 1, maxLength: 256, description: "Who to send to: phone, email, or group ID" }),
            file: t.File({ maxSize: 100 * 1024 * 1024, description: "The file to send (photos, videos, documents, etc.)" }),
            audio: t.Optional(t.Union([t.Boolean(), t.String()], { description: "Set to true to send as an audio message (audio files only)" })),
            service: t.Optional(t.Union([t.Literal("iMessage"), t.Literal("SMS")], { description: "Force iMessage or SMS" })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                id: t.String(),
                to: t.String(),
                attachments: t.Optional(t.Array(t.Object({
                    id: t.String(),
                    name: t.Nullable(t.String()),
                    size: t.Number(),
                    type: t.Nullable(t.String()),
                }))),
            }),
        }),
        detail: {
            tags: ["Attachments"],
            summary: "Send a file",
            description: "Send photos, videos, documents, or any file. Set audio=true to send audio files as audio messages.",
        },
    })

    // POST /send/sticker - Send sticker
    app.post("/send/sticker", createHandler(async (auth, { body }) => {
        const { to, file, replyTo, stickerX, stickerY, stickerScale, stickerRotation, stickerWidth, service } = body
        const chatGuid = toChatGuid(to, service)

        const result: any = await withSdk(auth, sdk =>
            withTempFile(file, path => sdk.attachments.sendSticker({
                chatGuid,
                filePath: path,
                ...(replyTo && {
                    selectedMessageGuid: replyTo,
                    stickerX: stickerX !== undefined ? Number(stickerX) : 0.5,
                    stickerY: stickerY !== undefined ? Number(stickerY) : 0.5,
                    stickerScale: stickerScale !== undefined ? Number(stickerScale) : 0.75,
                    stickerRotation: stickerRotation !== undefined ? Number(stickerRotation) : 0,
                    stickerWidth: stickerWidth !== undefined ? Number(stickerWidth) : 300,
                }),
            }))
        )

        return {
            ok: true,
            data: {
                id: result.guid,
                to: fromChatGuid(chatGuid),
                isSticker: true,
                replyTo: replyTo || null,
                attachments: result.attachments?.map((a: any) => ({
                    id: a.guid,
                    name: a.transferName,
                    size: a.totalBytes,
                    type: a.mimeType,
                    isSticker: a.isSticker,
                })),
            }
        }
    }), {
        body: t.Object({
            to: t.String({ minLength: 1, maxLength: 256, description: "Who to send to: phone, email, or group ID" }),
            file: t.File({ maxSize: 10 * 1024 * 1024, description: "Sticker image (PNG recommended)" }),
            replyTo: t.Optional(t.String({ maxLength: 128, description: "Attach sticker to this message (paste message ID)" })),
            stickerX: t.Optional(t.Union([t.Number(), t.String()], { description: "X position (0-1), default 0.5 = center" })),
            stickerY: t.Optional(t.Union([t.Number(), t.String()], { description: "Y position (0-1), default 0.5 = center" })),
            stickerScale: t.Optional(t.Union([t.Number(), t.String()], { description: "Scale (0-1), default 0.75" })),
            stickerRotation: t.Optional(t.Union([t.Number(), t.String()], { description: "Rotation in radians, default 0" })),
            stickerWidth: t.Optional(t.Union([t.Number(), t.String()], { description: "Width in pixels, default 300" })),
            service: t.Optional(t.Union([t.Literal("iMessage"), t.Literal("SMS")], { description: "Force iMessage or SMS" })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                id: t.String(),
                to: t.String(),
                isSticker: t.Literal(true),
                replyTo: t.Nullable(t.String()),
                attachments: t.Optional(t.Array(t.Object({
                    id: t.String(),
                    name: t.Nullable(t.String()),
                    size: t.Number(),
                    type: t.Nullable(t.String()),
                    isSticker: t.Optional(t.Boolean()),
                }))),
            }),
        }),
        detail: {
            tags: ["Attachments"],
            summary: "Send a sticker",
            description: "Send a sticker image. If replyTo is set, the sticker is associated with the target message.",
        },
    })

    // GET /messages - List messages
    app.get("/messages", createHandler(async (auth, { query }) => {
        const { limit = 50, offset = 0, chat } = query
        const options: any = { limit: Number(limit), offset: Number(offset) }
        if (chat) options.chatGuid = toChatGuid(chat)

        const messages: any = await withSdk(auth, sdk => sdk.messages.getMessages(options))

        return {
            ok: true,
            data: messages.map((m: any) => ({
                id: m.guid,
                text: m.text,
                from: m.isFromMe ? "me" : (m.handle?.address ?? ""),
                chat: m.chats?.[0]?.guid ? fromChatGuid(m.chats[0].guid) : null,
                sentAt: m.dateCreated,
            }))
        }
    }), {
        query: t.Object({
            limit: t.Optional(t.Numeric({ description: "How many messages to fetch", default: 50 })),
            offset: t.Optional(t.Numeric({ description: "Skip this many messages (for loading older ones)", default: 0 })),
            chat: t.Optional(t.String({ description: "Only show messages from this conversation" })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Array(t.Object({
                id: t.String(),
                text: t.Nullable(t.String()),
                from: t.MaybeEmpty(t.String()),
                chat: t.Nullable(t.String()),
                sentAt: t.Number(),
            })),
        }),
        detail: {
            tags: ["Messages"],
            summary: "List recent messages",
            description: "Get messages from all chats or a specific chat. Results are sorted newest first.",
        },
    })

    // GET /messages/search - Search messages
    app.get("/messages/search", createHandler(async (auth, { query, set }) => {
        const { q, limit = 20 } = query
        if (!q) { set.status = 400; return { ok: false, error: { code: "BAD_REQUEST", message: "q required" } } }

        try {
            const messages: any = await withSdk(auth, sdk => sdk.messages.searchMessages({ query: q, limit: Number(limit) }))
            return { ok: true, data: messages.map((m: any) => ({ id: m.guid, text: m.text, from: m.isFromMe ? "me" : m.handle?.address, sentAt: m.dateCreated })) }
        } catch (e: any) {
            if (e?.response?.status === 404) return { ok: true, data: [] }
            throw e
        }
    }), {
        query: t.Object({
            q: t.String({ minLength: 1, description: "What to search for" }),
            limit: t.Optional(t.Numeric({ description: "Max results", default: 20 })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Array(t.Object({
                id: t.String(),
                text: t.Nullable(t.String()),
                from: t.MaybeEmpty(t.String()),
                sentAt: t.Number(),
            })),
        }),
        detail: {
            tags: ["Messages"],
            summary: "Search messages",
            description: "Search messages by text. On macOS 13+ this uses Spotlight, which is token-based (word match) instead of simple substring LIKE.",
        },
    })

    // GET /messages/:id - Get single message
    app.get("/messages/:id", createHandler(async (auth, { params }) => {
        const msg: any = await withSdk(auth, sdk => sdk.messages.getMessage(params.id))
        return {
            ok: true,
            data: {
                id: msg.guid, text: msg.text, from: msg.isFromMe ? "me" : msg.handle?.address,
                chat: msg.chats?.[0]?.guid ? fromChatGuid(msg.chats[0].guid) : null,
                sentAt: msg.dateCreated, read: !!msg.dateRead, delivered: !!msg.dateDelivered,
            }
        }
    }), {
        params: t.Object({ id: t.String({ description: "Message GUID" }) }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                id: t.String(),
                text: t.Nullable(t.String()),
                from: t.MaybeEmpty(t.String()),
                chat: t.Nullable(t.String()),
                sentAt: t.Number(),
                read: t.Boolean(),
                delivered: t.Boolean(),
            }),
        }),
        detail: { tags: ["Messages"], summary: "Get message by ID" },
    })

    // PATCH /messages/:id - Edit message
    app.patch("/messages/:id", createHandler(async (auth, { params, body }) => {
        await withSdk(auth, sdk => sdk.messages.editMessage({ messageGuid: params.id, editedMessage: body.text, partIndex: 0 }))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Message GUID" }) }),
        body: t.Object({ text: t.String({ minLength: 1, description: "The new text to replace the original message" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: {
            tags: ["Messages"],
            summary: "Edit a sent message",
            description: "Replace the text of a message you sent. Only works on messages you sent.",
        },
    })

    // DELETE /messages/:id - Unsend message
    app.delete("/messages/:id", createHandler(async (auth, { params }) => {
        await withSdk(auth, sdk => sdk.messages.unsendMessage({ messageGuid: params.id }))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Message GUID" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: {
            tags: ["Messages"],
            summary: "Unsend a message",
            description: "Remove a message you sent from the conversation.",
        },
    })

    // POST /messages/:id/react - Send reaction
    app.post("/messages/:id/react", createHandler(async (auth, { params, body }) => {
        const chatGuid = toChatGuid(body.chat)
        await withSdk(auth, sdk => sdk.messages.sendReaction({
            chatGuid,
            messageGuid: params.id,
            reaction: body.type,
        }))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Message GUID" }) }),
        body: t.Object({
            chat: t.String({ minLength: 1, maxLength: 256, description: "Which conversation this message is in" }),
            type: t.String({ minLength: 1, description: "Tapback: love ❤️, like 👍, dislike 👎, laugh 😂, emphasize ‼️, question ❓" }),
        }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: {
            tags: ["Messages"],
            summary: "Add a tapback reaction",
            description: "Add a reaction (heart, thumbs up, etc.) to any message in a conversation.",
        },
    })

    // DELETE /messages/:id/react - Remove reaction
    app.delete("/messages/:id/react", createHandler(async (auth, { params, body }) => {
        const chatGuid = toChatGuid(body.chat)
        await withSdk(auth, sdk => sdk.messages.sendReaction({
            chatGuid,
            messageGuid: params.id,
            reaction: `-${body.type}`,  // Negative prefix to remove reaction
        }))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Message GUID" }) }),
        body: t.Object({
            chat: t.String({ minLength: 1, maxLength: 256, description: "Chat identifier where the message exists" }),
            type: t.String({ minLength: 1, description: "Reaction type to remove: love, like, dislike, laugh, emphasize, question" }),
        }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: {
            tags: ["Messages"],
            summary: "Remove a tapback reaction",
            description: "Remove a reaction you previously added to a message.",
        },
    })
}
