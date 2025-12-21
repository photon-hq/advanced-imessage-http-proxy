import { Server as Engine } from "@socket.io/bun-engine"
import { Server, Socket } from "socket.io"

import { sdkPool } from "./sdk-pool"
import { parseAuth } from "./auth"

const EVENTS = [
    "new-message",
    "message-updated",
    "updated-message",
    "chat-read-status-changed",
    "group-name-change",
    "participant-added",
    "participant-removed",
    "participant-left",
    "group-icon-changed",
    "group-icon-removed",
    "message-send-error",
    "typing-indicator",
    "new-server",
    "incoming-facetime",
    "ft-call-status-changed",
    "hello-world", // SDK connection test event
] as const

const io = new Server()
const engine = new Engine()
io.bind(engine)

function getCredentialKey(serverUrl: string, apiKey: string): string {
    return JSON.stringify({ serverUrl, apiKey })
}

const socketCredentials = new Map<string, { serverUrl: string; apiKey: string }>()
const activeSockets = new Map<string, Set<Socket>>()
const eventCleanups = new Map<string, () => void>()
const initLocks = new Map<string, Promise<void>>()

io.on("connection", async (socket) => {
    const token = socket.handshake.auth?.token as string | undefined

    if (!token) {
        socket.emit("error", { message: "Missing authentication token" })
        socket.disconnect()
        return
    }

    const auth = parseAuth(`Bearer ${token}`)

    if (!auth) {
        socket.emit("error", { message: "Invalid authentication token" })
        socket.disconnect()
        return
    }

    const { serverUrl, apiKey } = auth
    const key = getCredentialKey(serverUrl, apiKey)

    try {
        const sdk = await sdkPool.acquire(serverUrl, apiKey)
        socketCredentials.set(socket.id, { serverUrl, apiKey })

        socket.on("disconnect", () => {
            const creds = socketCredentials.get(socket.id)
            if (!creds || !socketCredentials.delete(socket.id)) return

            const { serverUrl, apiKey } = creds
            const key = getCredentialKey(serverUrl, apiKey)
            const sockets = activeSockets.get(key)

            if (sockets) {
                sockets.delete(socket)
                if (sockets.size === 0) {
                    eventCleanups.get(key)?.()
                    eventCleanups.delete(key)
                    activeSockets.delete(key)
                    initLocks.delete(key)
                }
            }

            sdkPool.release(serverUrl, apiKey)
        })

        await sdkPool.ensureConnected(serverUrl, apiKey)

        let initPromise = initLocks.get(key)
        if (!initPromise) {
            initPromise = (async () => {
                if (activeSockets.has(key)) return

                activeSockets.set(key, new Set())

                const listeners = EVENTS.map(event => {
                    const handler = (data: unknown) => {
                        const sockets = activeSockets.get(key)
                        if (sockets) {
                            for (const s of sockets) s.emit(event, data)
                        }
                    }
                    sdk.on(event as any, handler)
                    return { event, handler }
                })

                eventCleanups.set(key, () => {
                    for (const { event, handler } of listeners) {
                        sdk.off(event as any, handler)
                    }
                })
            })()

            initLocks.set(key, initPromise)
        }

        await initPromise
        const sockets = activeSockets.get(key)
        if (sockets) sockets.add(socket)
        socket.emit("ready")

    } catch (error) {
        const creds = socketCredentials.get(socket.id)
        if (creds && socketCredentials.delete(socket.id)) {
            sdkPool.release(creds.serverUrl, creds.apiKey)
        }
        socket.emit("error", { message: String(error) })
        socket.disconnect()
    }
})

export { io, engine }

export function isSocketIORequest(url: URL): boolean {
    return url.pathname.startsWith("/socket.io/")
}
