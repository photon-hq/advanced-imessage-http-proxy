/**
 * Routes Entry
 */
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
    app.get("/health", () => ({ ok: true, data: { status: "healthy" } }))
}
