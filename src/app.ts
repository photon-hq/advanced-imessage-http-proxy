import { Elysia } from "elysia"
import { swagger } from "@elysiajs/swagger"

import { setupRoutes } from "./routes"
import { setupWebSocket } from "./ws/handler"
import { mapError } from "./middleware/error"

export function createApp() {
    const app = new Elysia()
        .use(swagger({
            documentation: {
                info: { title: "iMessage HTTP Proxy", version: "2.0.0", description: "Minimal iMessage API Proxy" },
            },
        }))
        .onError(({ error, set }) => {
            const mapped = mapError(error)
            set.status = mapped.status
            return { ok: false, error: mapped.error }
        })

    setupRoutes(app)
    setupWebSocket(app)

    return app
}
