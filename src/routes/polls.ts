/**
 * Poll Routes
 */
import { t } from "elysia"
import { parsePollDefinition } from "@photon-ai/advanced-imessage-kit"
import { createHandler, withSdk, toChatGuid } from "../core/auth"

export function setupPollRoutes(app: any): void {
    // POST /polls - Create poll
    app.post("/polls", createHandler(async (auth, { body }) => {
        const { to, question, options } = body
        const chatGuid = toChatGuid(to)

        const created: any = await withSdk(auth, sdk => sdk.polls.create({
            chatGuid, title: question, options,
        }))

        // Server has waited for message creation; parse payloadData directly
        const parsed = parsePollDefinition(created)
        
        if (parsed?.options?.length) {
            const responseOptions = parsed.options.map((o: any) => ({
                id: o.optionIdentifier,
                text: o.text,
            }))
            return { ok: true, data: { id: created.guid, question, options: responseOptions } }
        }

        // Fallback: return original string array if parsing fails
        return { ok: true, data: { id: created.guid, question, options } }
    }), {
        body: t.Object({
            to: t.String({ minLength: 1, maxLength: 256, description: "Who to send the poll to: phone, email, or group ID" }),
            question: t.Optional(t.String({ maxLength: 256, description: "The question you're asking" })),
            options: t.Array(t.String({ minLength: 1, maxLength: 128, description: "One answer option" }), { minItems: 2, maxItems: 10, description: "Possible answers (need at least 2)" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                id: t.String(),
                question: t.Optional(t.String()),
                options: t.Any(),
            }),
        }),
        detail: {
            tags: ["Polls"],
            summary: "Create a poll",
            description: "Send an iMessage poll. Recipients can vote directly in their Messages app.",
        },
    })

    // POST /polls/:id/vote - Vote
    app.post("/polls/:id/vote", createHandler(async (auth, { params, body }) => {
        const chatGuid = toChatGuid(body.chat)
        await withSdk(auth, sdk => sdk.polls.vote({
            chatGuid, pollMessageGuid: params.id, optionIdentifier: body.optionId,
        }))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Poll message GUID" }) }),
        body: t.Object({
            chat: t.String({ minLength: 1, maxLength: 256, description: "The conversation where the poll was sent" }),
            optionId: t.String({ minLength: 1, maxLength: 128, description: "Which option to vote for (from poll options)" }),
        }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Polls"], summary: "Vote on poll" },
    })

    // POST /polls/:id/unvote - Unvote
    app.post("/polls/:id/unvote", createHandler(async (auth, { params, body }) => {
        const chatGuid = toChatGuid(body.chat)
        await withSdk(auth, sdk => sdk.polls.unvote({
            chatGuid, pollMessageGuid: params.id, optionIdentifier: body.optionId,
        }))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Poll message GUID" }) }),
        body: t.Object({
            chat: t.String({ minLength: 1, maxLength: 256, description: "The conversation where the poll was sent" }),
            optionId: t.String({ minLength: 1, maxLength: 128, description: "Which option to remove your vote from" }),
        }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Polls"], summary: "Unvote on poll" },
    })

    // GET /polls/:id - Get poll details
    app.get("/polls/:id", createHandler(async (auth, { params }) => {
        try {
            const message: any = await withSdk(auth, sdk => sdk.messages.getMessage(params.id))
            const parsed = parsePollDefinition(message)
            
            if (parsed?.options?.length) {
                const responseOptions = parsed.options.map((o: any) => ({
                    id: o.optionIdentifier,
                    text: o.text,
                }))
                return { 
                    ok: true, 
                    data: { 
                        id: message.guid, 
                        question: parsed.title, 
                        options: responseOptions,
                        creatorHandle: parsed.creatorHandle,
                    } 
                }
            }
        } catch {
            // getMessage may fail (message not synced or doesn't exist)
        }
        
        return { ok: false, error: { code: "POLL_NOT_FOUND", message: "Poll not found or unable to parse. Try using the poll ID returned from POST /polls instead." } }
    }), {
        params: t.Object({ id: t.String({ description: "Poll message GUID" }) }),
        response: t.Object({
            ok: t.Boolean(),
            data: t.Optional(t.Object({
                id: t.String(),
                question: t.Optional(t.String()),
                options: t.Any(),
                creatorHandle: t.Optional(t.String()),
            })),
            error: t.Optional(t.Object({
                code: t.String(),
                message: t.String(),
            })),
        }),
        detail: {
            tags: ["Polls"],
            summary: "Get poll results",
            description: "See the current votes and options for a poll. Use the poll ID from the create response.",
        },
    })

    // POST /polls/:id/options - Add option to poll
    app.post("/polls/:id/options", createHandler(async (auth, { params, body }) => {
        const chatGuid = toChatGuid(body.chat)
        await withSdk(auth, sdk => sdk.polls.addOption({
            chatGuid,
            pollMessageGuid: params.id,
            optionText: body.text,
        }))
        return { ok: true }
    }), {
        params: t.Object({ id: t.String({ description: "Poll message GUID" }) }),
        body: t.Object({ 
            chat: t.String({ minLength: 1, maxLength: 256, description: "The conversation where the poll was sent" }), 
            text: t.String({ minLength: 1, maxLength: 128, description: "The new answer option to add" }) 
        }),
        response: t.Object({ ok: t.Literal(true) }),
        detail: { tags: ["Polls"], summary: "Add poll option" },
    })
}
