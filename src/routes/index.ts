/**
 * Routes Entry
 */
import { t } from "elysia"
import { setupMessageRoutes } from "./messages"
import { setupChatRoutes } from "./chats"
import { setupGroupRoutes } from "./groups"
import { setupAttachmentRoutes } from "./attachments"
import { setupPollRoutes } from "./polls"
import { setupServerRoutes } from "./server"

export function setupRoutes(app: any): void {
    setupMessageRoutes(app)
    setupChatRoutes(app)
    setupGroupRoutes(app)
    setupAttachmentRoutes(app)
    setupPollRoutes(app)
    setupServerRoutes(app)

    // Root endpoint - API info
    app.get("/", () => ({
        name: "iMessage HTTP Proxy",
        version: "1.0.0",
        documentation: "/swagger",
        health: "/health"
    }), {
        detail: { 
            tags: ["Server"], 
            summary: "API information",
            description: "Returns basic information about the API"
        },
        security: [],
    })

    // Health check
    app.get("/health", () => ({ ok: true, data: { status: "healthy" } }), {
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({ status: t.Literal("healthy") }),
        }),
        detail: { tags: ["Server"], summary: "Health check" },
        security: [],
    })
}
