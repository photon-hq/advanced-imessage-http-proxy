/**
 * Group Chat Routes
 */
import { t } from "elysia"
import { createHandler, withSdk, toChatGuid, fromChatGuid } from "../core/auth"
import { withTempFile } from "../core/upload"

function toGroupChatGuid(id: string): string {
    if (id.startsWith("group:")) {
        return toChatGuid(id)
    }
    return `any;+;${id}`
}

export function setupGroupRoutes(app: any): void {
    // POST /groups - Create group
    app.post("/groups", createHandler(async (auth, { body }) => {
        const { members, name, message } = body

        const result: any = await withSdk(auth, sdk => sdk.chats.createChat({
            addresses: members,
            message: message || "👋",
            service: "iMessage",
            method: "private-api",
        }))

        const groupId = fromChatGuid(result.guid)

        if (name && groupId) {
            await withSdk(auth, sdk => sdk.chats.updateChat(result.guid, { displayName: name }))
        }

        return { ok: true, data: { id: groupId, name: name || null, members } }
    }), {
        body: t.Object({
            members: t.Array(t.String({ minLength: 1, maxLength: 256, description: "Phone or email" }), { minItems: 2, maxItems: 32, description: "People to add to the group (at least 2)" }),
            name: t.Optional(t.String({ maxLength: 128, description: "Name shown at the top of the group chat" })),
            message: t.Optional(t.String({ maxLength: 1000, description: "First message to send (defaults to 👋 wave emoji)" })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                id: t.String(),
                name: t.Nullable(t.String()),
                members: t.Array(t.String()),
            }),
        }),
        detail: {
            tags: ["Groups"],
            summary: "Create a group chat",
            description: "Start a new group conversation with 2+ people. Returns the group ID needed for other group operations.",
        },
    })

    // PATCH /groups/:id - Update group
    app.patch("/groups/:id", createHandler(async (auth, { params, body }) => {
        const chatGuid = toGroupChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.updateChat(chatGuid, { displayName: body.name }))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Group ID (from create response or starts with 'group:')" }) }),
        body: t.Object({ name: t.String({ minLength: 1, maxLength: 128, description: "New name for the group" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Groups"], summary: "Update group name" },
    })

    // POST /groups/:id/icon - Set group icon
    app.post("/groups/:id/icon", createHandler(async (auth, { params, body }) => {
        const chatGuid = toGroupChatGuid(params.id)
        await withSdk(auth, sdk => withTempFile(body.file, path => sdk.chats.setGroupIcon(chatGuid, path)))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Group ID" }) }),
        body: t.Object({ file: t.File({ maxSize: 10 * 1024 * 1024, description: "Square image for the group icon" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Groups"], summary: "Set group icon" },
    })

    // DELETE /groups/:id/icon - Remove group icon
    app.delete("/groups/:id/icon", createHandler(async (auth, { params }) => {
        const chatGuid = toGroupChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.removeGroupIcon(chatGuid))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Group ID" }) }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Groups"], summary: "Remove group icon" },
    })

    // POST /groups/:id/participants - Add participant
    // Note: May timeout on some systems due to upstream limitations
    app.post("/groups/:id/participants", createHandler(async (auth, { params, body }) => {
        const chatGuid = toGroupChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.addParticipant(chatGuid, body.address))
        return { ok: true, data: { address: body.address } }
    }), {
        params: t.Object({ id: t.String({ description: "Group ID" }) }),
        body: t.Object({
            address: t.String({ minLength: 1, maxLength: 256, description: "Phone or email of the person to add" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({ address: t.String() }),
        }),
        detail: {
            tags: ["Groups"],
            summary: "Add someone to the group",
            description: "Invite a new person to an existing group chat.",
        },
    })

    // DELETE /groups/:id/participants/:address - Remove participant
    // Note: May timeout on some systems due to upstream limitations
    app.delete("/groups/:id/participants/:address", createHandler(async (auth, { params }) => {
        const chatGuid = toGroupChatGuid(params.id)
        await withSdk(auth, sdk => sdk.chats.removeParticipant(chatGuid, params.address))
        return { ok: true, data: { address: params.address } }
    }), {
        params: t.Object({
            id: t.String({ description: "Group ID" }),
            address: t.String({ description: "Phone or email of the person to remove" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({ address: t.String() }),
        }),
        detail: {
            tags: ["Groups"],
            summary: "Remove someone from the group",
            description: "Remove a person from the group chat.",
        },
    })
}
