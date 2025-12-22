/**
 * Chat Routes
 */
import { t } from "elysia"
import { createHandler, withSdk, toChatGuid, fromChatGuid } from "../core/auth"

const DEFAULT_SERVICE = "iMessage"

export function setupChatRoutes(app: any): void {
    // GET /chats - List chats
    app.get("/chats", createHandler(async (auth, { query }) => {
        const { limit = 50 } = query
        const chats: any = await withSdk(auth, sdk => sdk.chats.getChats({ limit: Number(limit) }))

        return {
            ok: true,
            data: chats.map((c: any) => ({
                id: fromChatGuid(c.guid),
                name: c.displayName || null,
                isGroup: c.guid.includes(";+;"),
                lastMessage: c.lastMessage?.text ?? "",
                lastMessageAt: c.lastMessage?.dateCreated,
            }))
        }
    }), {
        query: t.Object({
            limit: t.Optional(t.Numeric({ description: "How many conversations to fetch", default: 50 })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Array(t.Object({
                id: t.String(),
                name: t.Nullable(t.String()),
                isGroup: t.Boolean(),
                lastMessage: t.MaybeEmpty(t.String()),
                lastMessageAt: t.Optional(t.Number()),
            })),
        }),
        detail: {
            tags: ["Chats"],
            summary: "List all conversations",
            description: "Get your recent conversations (both 1-on-1 and groups), sorted by most recent activity.",
        },
    })

    // GET /chats/:id - Get chat
    app.get("/chats/:id", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        const chat: any = await withSdk(auth, sdk => sdk.chats.getChat(chatGuid))

        return {
            ok: true,
            data: {
                id: fromChatGuid(chat.guid),
                name: chat.displayName || null,
                isGroup: chat.guid.includes(";+;"),
                participants: chat.participants?.map((p: any) => p.address) || [],
            }
        }
    }), {
        params: t.Object({
            id: t.String({ description: "Phone, email, or group ID (group:xxx)" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                id: t.String(),
                name: t.Nullable(t.String()),
                isGroup: t.Boolean(),
                participants: t.Array(t.String()),
            }),
        }),
        detail: { tags: ["Chats"], summary: "Get chat details" },
    })

    // GET /chats/:id/participants - Get chat participants
    app.get("/chats/:id/participants", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        const chats = await withSdk(auth, sdk => sdk.chats.getChats())
        const chat = chats.find(c => c.guid === chatGuid)

        if (!chat) throw new Error(`Chat not found: ${chatGuid}`)

        return {
            ok: true,
            data: {
                chatId: fromChatGuid(chat.guid),
                chatName: chat.displayName || null,
                participants: chat.participants?.map((p: any) => ({
                    address: p.address,
                    service: p.service || DEFAULT_SERVICE,
                })) || [],
            }
        }
    }), {
        params: t.Object({
            id: t.String({ description: "Chat identifier (phone, email, or group:xxx)" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                chatId: t.String(),
                chatName: t.Nullable(t.String()),
                participants: t.Array(t.Object({
                    address: t.String(),
                    service: t.String(),
                })),
            }),
        }),
        detail: {
            tags: ["Chats"],
            summary: "Get chat participants",
            description: "Get the list of participants in a chat (primarily useful for group chats). Returns participant addresses and service types.",
        },
    })

    // GET /chats/:id/messages - Get chat messages
    app.get("/chats/:id/messages", createHandler(async (auth, { params, query }) => {
        const chatGuid = toChatGuid(params.id)
        const { limit = 50 } = query
        const messages: any = await withSdk(auth, sdk => sdk.chats.getChatMessages(chatGuid, { limit: Number(limit) }))

        return {
            ok: true,
            data: messages.map((m: any) => ({
                id: m.guid,
                text: m.text,
                from: m.isFromMe ? "me" : m.handle?.address,
                sentAt: m.dateCreated,
            }))
        }
    }), {
        params: t.Object({
            id: t.String({ description: "Conversation ID" }),
        }),
        query: t.Object({
            limit: t.Optional(t.Numeric({ description: "How many messages to fetch", default: 50 })),
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
        detail: { tags: ["Chats"], summary: "Get chat messages" },
    })

    // POST /chats/:id/read - Mark as read
    app.post("/chats/:id/read", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.markChatRead(chatGuid))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Chat identifier" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Chats"], summary: "Mark as read" },
    })

    // POST /chats/:id/unread - Mark as unread
    app.post("/chats/:id/unread", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.markChatUnread(chatGuid))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Chat identifier" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Chats"], summary: "Mark as unread" },
    })

    // POST /chats/:id/typing - Start typing
    app.post("/chats/:id/typing", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.startTyping(chatGuid))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Chat identifier" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: {
            tags: ["Chats"],
            summary: "Show typing indicator",
            description: "Start the typing indicator for this chat. Call the stop-typing endpoint when done.",
        },
    })

    // DELETE /chats/:id/typing - Stop typing
    app.delete("/chats/:id/typing", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.stopTyping(chatGuid))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Chat identifier" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: {
            tags: ["Chats"],
            summary: "Hide typing indicator",
            description: "Stop the typing indicator for this chat.",
        },
    })

    // POST /chats/:id/contact/share - Share contact card
    app.post("/chats/:id/contact/share", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.contacts.shareContactCard(chatGuid))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Chat identifier" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Chats"], summary: "Share contact card" },
    })

    // GET /chats/:id/contact/status - Check if contact sharing is recommended
    app.get("/chats/:id/contact/status", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        try {
            const shouldShare: any = await withSdk(auth, sdk => sdk.contacts.shouldShareContact(chatGuid))
            return { ok: true, data: { shouldShare, recommended: shouldShare } }
        } catch (error: any) {
            // Backend may not support this feature or chat doesn't exist
            if (error?.response?.status === 404 || error?.message?.includes('NOT_FOUND')) {
                return { 
                    ok: true, 
                    data: { 
                        shouldShare: false, 
                        recommended: false,
                        note: "Backend does not support this feature or chat not found"
                    } 
                }
            }
            throw error
        }
    }), {
        params: t.Object({ id: t.String({ description: "Chat identifier" }) }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                shouldShare: t.Boolean(),
                recommended: t.Boolean(),
                note: t.Optional(t.String()),
            }),
        }),
        detail: { tags: ["Chats"], summary: "Check contact sharing status" },
    })
}
