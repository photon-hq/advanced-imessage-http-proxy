import { Elysia } from "elysia"
import { swagger } from "@elysiajs/swagger"

import { setupRoutes } from "./routes"
import { mapError } from "./middleware/error"

const OPENAPI_DESCRIPTION = [
    "A lightweight HTTP proxy for iMessage, built on top of Advanced iMessage Kit.",
    "",
    "## Authentication",
    "",
    "All endpoints require Bearer token authentication:",
    "",
    "```text",
    "Authorization: Bearer <base64(serverUrl|apiKey)>",
    "```",
    "",
    "Example:",
    "```bash",
    "TOKEN=$(echo -n \"https://your-server.com|your-api-key\" | base64)",
    "curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/server",
    "```",
    "",
    "## Rate Limits",
    "",
    "Rate limits are enforced by the upstream iMessage server, not this proxy.",
    "",
    "## Real-time Events (Socket.IO)",
    "",
    "Connect via Socket.IO for real-time events:",
    "",
    "```javascript",
    "import { io } from \"socket.io-client\"",
    "",
    "const socket = io(\"https://your-proxy.com\", {",
    "  auth: { token: \"YOUR_BASE64_TOKEN\" }",
    "})",
    "",
    "socket.on(\"new-message\", (message) => {",
    "  console.log(\"New message:\", message.text)",
    "})",
    "```",
].join("\n")

export function createApp() {
    const app = new Elysia()
        .use(swagger({
            path: "/swagger",
            documentation: {
                info: {
                    title: "iMessage HTTP Proxy",
                    version: "1.0.0",
                    description: OPENAPI_DESCRIPTION,
                    contact: {
                        name: "API Support",
                    },
                    license: {
                        name: "MIT",
                    },
                },
                tags: [
                    { name: "Messages", description: "Send, receive, and manage messages" },
                    { name: "Chats", description: "Manage conversations and chat state" },
                    { name: "Groups", description: "Create and manage group chats" },
                    { name: "Polls", description: "Create and interact with polls" },
                    { name: "Attachments", description: "Send and retrieve attachments" },
                    { name: "Server", description: "Server info and utilities" },
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "base64(serverUrl|apiKey)",
                            description: "Base64 encoded server URL and API key separated by |",
                        },
                    },
                },
                security: [{ bearerAuth: [] }],
            },
            exclude: ["/swagger", "/swagger/json"],
        }))
        .onError(({ error, set }) => {
            const mapped = mapError(error)
            set.status = mapped.status
            return { ok: false, error: mapped.error }
        })

    setupRoutes(app)

    return app
}
