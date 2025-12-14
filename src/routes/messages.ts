/**
 * Message Routes
 */
import { t } from "elysia"
import { createHandler, withSdk, toChatGuid, fromChatGuid } from "../core/auth"
import { withTempFile } from "../core/upload"

export function setupMessageRoutes(app: any): void {
    // POST /send - Send message
    app.post("/send", createHandler(async (auth, { body }) => {
        const { to, text, subject, effect, replyTo } = body
        const chatGuid = toChatGuid(to)
        const effectId = effect ? `com.apple.messages.effect.CK${effect.charAt(0).toUpperCase() + effect.slice(1)}Effect` : undefined

        const result: any = await withSdk(auth, sdk => sdk.messages.sendMessage({
            chatGuid, message: text, subject, effectId, selectedMessageGuid: replyTo,
        }))

        return { ok: true, data: { id: result.guid, to: fromChatGuid(chatGuid), text: result.text, sentAt: result.dateCreated } }
    }), {
        body: t.Object({
            to: t.String({ minLength: 1, maxLength: 256 }),
            text: t.String({ minLength: 1, maxLength: 10000 }),
            subject: t.Optional(t.String({ maxLength: 256 })),
            effect: t.Optional(t.Union([
                t.Literal("confetti"),
                t.Literal("fireworks"),
                t.Literal("balloons"),
                t.Literal("heart"),
                t.Literal("lasers"),
                t.Literal("sparkles"),
            ])),
            replyTo: t.Optional(t.String({ maxLength: 128 })),
        }),
        detail: { tags: ["Messages"], summary: "Send a message" },
    })

    // POST /send/file - Send file
    app.post("/send/file", createHandler(async (auth, { body }) => {
        const { to, file, audio } = body
        const chatGuid = toChatGuid(to)

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
            to: t.String({ minLength: 1, maxLength: 256 }),
            file: t.File({ maxSize: 100 * 1024 * 1024 }), // 100MB limit
            audio: t.Optional(t.Union([t.Boolean(), t.String()])),
        }),
        detail: { tags: ["Attachments"], summary: "Send a file" },
    })

    // POST /send/sticker - Send sticker
    app.post("/send/sticker", createHandler(async (auth, { body }) => {
        const { to, file, replyTo, stickerX, stickerY, stickerScale, stickerRotation, stickerWidth } = body
        const chatGuid = toChatGuid(to)

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
            to: t.String({ minLength: 1, maxLength: 256 }),
            file: t.File({ maxSize: 10 * 1024 * 1024 }), // 10MB limit for stickers
            replyTo: t.Optional(t.String({ maxLength: 128 })), // Optional: attach sticker to message
            stickerX: t.Optional(t.Union([t.Number(), t.String()])), // Position X (0-1), default: 0.5
            stickerY: t.Optional(t.Union([t.Number(), t.String()])), // Position Y (0-1), default: 0.5
            stickerScale: t.Optional(t.Union([t.Number(), t.String()])), // Scale (0-1), default: 0.75
            stickerRotation: t.Optional(t.Union([t.Number(), t.String()])), // Rotation in radians, default: 0
            stickerWidth: t.Optional(t.Union([t.Number(), t.String()])),
        }),
        detail: { tags: ["Attachments"], summary: "Send a sticker" },
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
                from: m.isFromMe ? "me" : m.handle?.address,
                chat: m.chats?.[0]?.guid ? fromChatGuid(m.chats[0].guid) : null,
                sentAt: m.dateCreated,
            }))
        }
    }), {
        query: t.Object({
            limit: t.Optional(t.Numeric({ description: "Max number of messages to return", default: 50 })),
            offset: t.Optional(t.Numeric({ description: "Offset for pagination", default: 0 })),
            chat: t.Optional(t.String({ description: "Chat identifier to filter messages" })),
        }),
        detail: { tags: ["Messages"], summary: "List messages" },
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
            q: t.String({ minLength: 1, description: "Search text" }),
            limit: t.Optional(t.Numeric({ description: "Max number of results to return", default: 20 })),
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
    }), { detail: { tags: ["Messages"], summary: "Get message by ID" } })

    // PATCH /messages/:id - Edit message
    app.patch("/messages/:id", createHandler(async (auth, { params, body }) => {
        await withSdk(auth, sdk => sdk.messages.editMessage({ messageGuid: params.id, editedMessage: body.text, partIndex: 0 }))
        return { ok: true }
    }), { body: t.Object({ text: t.String() }), detail: { tags: ["Messages"], summary: "Edit message" } })

    // DELETE /messages/:id - Unsend message
    app.delete("/messages/:id", createHandler(async (auth, { params }) => {
        await withSdk(auth, sdk => sdk.messages.unsendMessage({ messageGuid: params.id }))
        return { ok: true }
    }), { detail: { tags: ["Messages"], summary: "Unsend message" } })

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
        body: t.Object({ chat: t.String({ minLength: 1, maxLength: 256 }), type: t.String() }),
        detail: { tags: ["Messages"], summary: "React to message" },
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
        body: t.Object({ chat: t.String({ minLength: 1, maxLength: 256 }), type: t.String() }),
        detail: { tags: ["Messages"], summary: "Remove reaction" },
    })
}
