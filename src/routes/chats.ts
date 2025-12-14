/**
 * Chat Routes
 */
import { t } from "elysia"
import { createHandler, withSdk, toChatGuid, fromChatGuid } from "../core/auth"

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
                lastMessage: c.lastMessage?.text,
                lastMessageAt: c.lastMessage?.dateCreated,
            }))
        }
    }), {
        query: t.Object({
            limit: t.Optional(t.Numeric({ description: "Max number of chats to return", default: 50 })),
        }),
        detail: { tags: ["Chats"], summary: "List chats" },
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
    }), { detail: { tags: ["Chats"], summary: "Get chat details" } })

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
        query: t.Object({
            limit: t.Optional(t.Numeric({ description: "Max number of messages to return", default: 50 })),
        }),
        detail: { tags: ["Chats"], summary: "Get chat messages" },
    })

    // POST /chats/:id/read - Mark as read
    app.post("/chats/:id/read", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.markChatRead(chatGuid))
        return { ok: true }
    }), { detail: { tags: ["Chats"], summary: "Mark as read" } })

    // POST /chats/:id/unread - Mark as unread
    app.post("/chats/:id/unread", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.markChatUnread(chatGuid))
        return { ok: true }
    }), { detail: { tags: ["Chats"], summary: "Mark as unread" } })

    // POST /chats/:id/typing - Start typing
    app.post("/chats/:id/typing", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.startTyping(chatGuid))
        return { ok: true }
    }), { detail: { tags: ["Chats"], summary: "Start typing" } })

    // DELETE /chats/:id/typing - Stop typing
    app.delete("/chats/:id/typing", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.stopTyping(chatGuid))
        return { ok: true }
    }), { detail: { tags: ["Chats"], summary: "Stop typing" } })

    // POST /chats/:id/contact/share - Share contact card
    app.post("/chats/:id/contact/share", createHandler(async (auth, { params }) => {
        const chatGuid = toChatGuid(params.id)
        await withSdk(auth, sdk => sdk.contacts.shareContactCard(chatGuid))
        return { ok: true }
    }), { detail: { tags: ["Chats"], summary: "Share contact card" } })

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
    }), { detail: { tags: ["Chats"], summary: "Check contact sharing status" } })
}
