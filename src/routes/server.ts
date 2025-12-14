/**
 * Server & Utility Routes
 */
import { t } from "elysia"
import { createHandler, withSdk } from "../core/auth"

export function setupServerRoutes(app: any): void {
    // GET /server - Server info
    app.get("/server", createHandler(async (auth) => {
        const info: any = await withSdk(auth, sdk => sdk.server.getServerInfo())
        return { ok: true, data: { os: info.os_version, server: info.server_version, mac: info.computer_name } }
    }), { detail: { tags: ["Server"], summary: "Get server info" } })

    // GET /server/stats - Message statistics
    app.get("/server/stats", createHandler(async (auth) => {
        const stats: any = await withSdk(auth, sdk => sdk.server.getMessageStats())
        return { ok: true, data: stats }
    }), { detail: { tags: ["Server"], summary: "Get message statistics" } })

    // GET /check/:address - Check iMessage availability
    app.get("/check/:address", createHandler(async (auth, { params }) => {
        const available: any = await withSdk(auth, sdk => sdk.handles.getHandleAvailability(params.address, "imessage"))
        return { ok: true, data: { address: params.address, available } }
    }), { detail: { tags: ["Server"], summary: "Check iMessage availability" } })

    // GET /contacts - List contacts
    app.get("/contacts", createHandler(async (auth) => {
        const contacts: any = await withSdk(auth, sdk => sdk.contacts.getContacts())
        return { ok: true, data: contacts }
    }), { detail: { tags: ["Server"], summary: "List contacts" } })

    // GET /handles - List handles
    app.get("/handles", createHandler(async (auth, { query }) => {
        const { limit = 50 } = query
        const handles: any = await withSdk(auth, sdk => sdk.handles.queryHandles({ limit: Number(limit), offset: 0 }))
        return { ok: true, data: handles.data || handles }
    }), {
        query: t.Object({
            limit: t.Optional(t.Numeric({ description: "Max number of handles to return", default: 50 })),
        }),
        detail: { tags: ["Server"], summary: "List handles" },
    })

    // GET /icloud/friends - Get Find My Friends locations
    app.get("/icloud/friends", createHandler(async (auth) => {
        const friends: any = await withSdk(auth, sdk => sdk.icloud.getFindMyFriends())
        return { ok: true, data: friends }
    }), { detail: { tags: ["Server"], summary: "Get Find My Friends" } })
}
