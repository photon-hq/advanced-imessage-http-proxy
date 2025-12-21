import { createApp } from "./app"
import { engine, isSocketIORequest } from "./core/socket-server"

const PORT = Number(process.env.PORT) || 3000
const app = createApp()

export default {
    port: PORT,
    idleTimeout: 60, // Must be greater than Socket.IO pingInterval (default 25s)

    fetch(req: Request, server: any) {
        return isSocketIORequest(new URL(req.url))
            ? engine.handleRequest(req, server)
            : app.fetch(req)
    },

    websocket: engine.handler().websocket,
}

console.log(`iMessage HTTP Proxy running on http://localhost:${PORT}`)
console.log(`Swagger: http://localhost:${PORT}/swagger`)
console.log(`Socket.IO: ws://localhost:${PORT}/socket.io/`)
