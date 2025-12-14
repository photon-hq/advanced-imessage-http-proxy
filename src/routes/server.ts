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
    }), {
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                os: t.String(),
                server: t.String(),
                mac: t.String(),
            }),
        }),
        detail: { tags: ["Server"], summary: "Get server info" },
    })

    // GET /server/stats - Message statistics
    app.get("/server/stats", createHandler(async (auth) => {
        const stats: any = await withSdk(auth, sdk => sdk.server.getMessageStats())
        return { ok: true, data: stats }
    }), {
        response: t.Object({
            ok: t.Literal(true),
            data: t.Any(),
        }),
        detail: { tags: ["Server"], summary: "Get message statistics" },
    })

    // GET /check/:address - Check iMessage availability
    app.get("/check/:address", createHandler(async (auth, { params }) => {
        const available: any = await withSdk(auth, sdk => sdk.handles.getHandleAvailability(params.address, "imessage"))
        return { ok: true, data: { address: params.address, available } }
    }), {
        params: t.Object({
            address: t.String({ description: "Phone number or email address" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                address: t.String(),
                available: t.Boolean(),
            }),
        }),
        detail: {
            tags: ["Server"],
            summary: "Check if a contact uses iMessage",
            description: "Returns true if the phone/email is available for iMessage, false if iMessage is not available.",
        },
    })

    // GET /contacts - List contacts
    app.get("/contacts", createHandler(async (auth) => {
        const contacts: any = await withSdk(auth, sdk => sdk.contacts.getContacts())
        return { ok: true, data: contacts }
    }), {
        response: t.Object({
            ok: t.Literal(true),
            data: t.Any(),
        }),
        detail: { tags: ["Server"], summary: "List contacts" },
    })

    // GET /handles - List handles
    app.get("/handles", createHandler(async (auth, { query }) => {
        const { limit = 50 } = query
        const handles: any = await withSdk(auth, sdk => sdk.handles.queryHandles({ limit: Number(limit), offset: 0 }))
        return { ok: true, data: handles.data || handles }
    }), {
        query: t.Object({
            limit: t.Optional(t.Numeric({ description: "How many to fetch", default: 50 })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Any(),
        }),
        detail: { tags: ["Server"], summary: "List handles" },
    })

    // GET /icloud/friends - Get Find My Friends locations
    app.get("/icloud/friends", createHandler(async (auth) => {
        const friends: any = await withSdk(auth, sdk => sdk.icloud.getFindMyFriends())
        return { ok: true, data: friends }
    }), {
        response: t.Object({
            ok: t.Literal(true),
            data: t.Any(),
        }),
        detail: { tags: ["Server"], summary: "Get Find My Friends" },
    })
}
