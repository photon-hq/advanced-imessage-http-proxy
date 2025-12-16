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

    // Root - Redirect to GitHub
    app.get("/", ({ set }: { set: any }) => {
        set.status = 302
        set.headers = {
            'Location': 'https://github.com/photon-hq/advanced-imessage-http-proxy'
        }
        return
    }, {
        detail: { tags: ["Server"], summary: "Redirect to GitHub repository" },
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
