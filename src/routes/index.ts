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
