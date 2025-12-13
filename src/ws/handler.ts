import { sdkPool } from "../core/sdk-pool"
import { wsHub } from "../core/ws-hub"
import { extractConfigFromQuery } from "../middleware/config"
import { parseAuth } from "../core/auth"

// ------------------------------------------------------------------------------
// WebSocket Handler
// ------------------------------------------------------------------------------

export function setupWebSocket(app: any): void {
    app.ws("/ws", {
        async open(ws: any) {
            try {
                // Prefer Authorization header using the same format as HTTP routes
                const headers = ws.data?.headers ?? {}
                const authHeader: string | undefined = headers["authorization"] || headers["Authorization"]

                let serverUrl: string
                let apiKey: string

                const auth = parseAuth(authHeader)
                if (auth) {
                    serverUrl = auth.serverUrl
                    apiKey = auth.apiKey
                } else {
                    // Fallback to legacy query-based config for backwards compatibility
                    const query = ws.data?.query ?? {}
                    const cfg = extractConfigFromQuery(query)
                    serverUrl = cfg.serverUrl
                    apiKey = cfg.apiKey
                }

                const sdk = await sdkPool.acquire(serverUrl, apiKey)
                // Store credentials immediately so that close handler can always
                // release the SDK even if ensureConnected or subscribe fails.
                ws.data = { serverUrl, apiKey }

                await sdkPool.ensureConnected(serverUrl, apiKey)

                wsHub.subscribe(ws, serverUrl, apiKey, sdk)
            } catch (error) {
                ws.send(JSON.stringify({ event: "error", data: { message: String(error) } }))
                ws.close()
            }
        },

        close(ws: any) {
            const { serverUrl, apiKey } = ws.data ?? {}

            if (serverUrl && apiKey) {
                wsHub.unsubscribe(ws, serverUrl, apiKey)
                sdkPool.release(serverUrl, apiKey)
            }
        },

        message() {},
    })
}
