import type { AdvancedIMessageKit } from "@photon-ai/advanced-imessage-kit"
import type { ServerWebSocket } from "bun"

// ------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------

type WS = ServerWebSocket<{ serverUrl: string; apiKey: string }>

// ------------------------------------------------------------------------------
// Events
// ------------------------------------------------------------------------------

const EVENTS = [
    "new-message",
    "updated-message",
    "message-send-error",
    "typing-indicator",
    "chat-read-status-changed",
    "group-name-change",
    "participant-added",
    "participant-removed",
    "participant-left",
    "group-icon-changed",
    "group-icon-removed",
    "new-findmy-location",
] as const

// ------------------------------------------------------------------------------
// WebSocket Hub
// ------------------------------------------------------------------------------

class WebSocketHub {
    private subscriptions = new Map<string, Set<WS>>()

    // ------------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------------

    subscribe(ws: WS, serverUrl: string, apiKey: string, sdk: AdvancedIMessageKit): void {
        const key = this.getKey(serverUrl, apiKey)

        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, new Set())
            this.registerEvents(key, sdk)
        }

        this.subscriptions.get(key)!.add(ws)
    }

    unsubscribe(ws: WS, serverUrl: string, apiKey: string): void {
        const key = this.getKey(serverUrl, apiKey)
        const clients = this.subscriptions.get(key)

        if (!clients) return

        clients.delete(ws)

        if (clients.size === 0) {
            this.subscriptions.delete(key)
        }
    }

    // ------------------------------------------------------------------------
    // Private Methods
    // ------------------------------------------------------------------------

    private registerEvents(key: string, sdk: AdvancedIMessageKit): void {
        for (const event of EVENTS) {
            sdk.on(event as any, (data: unknown) => this.broadcast(key, event, data))
        }
    }

    private broadcast(key: string, event: string, data: unknown): void {
        const clients = this.subscriptions.get(key)

        if (!clients) return

        const message = JSON.stringify({
            event,
            data,
            timestamp: Date.now(),
        })

        for (const ws of clients) {
            try {
                ws.send(message)
            } catch {
                clients.delete(ws)
            }
        }
    }

    private getKey(serverUrl: string, apiKey: string): string {
        return `${serverUrl}::${apiKey}`
    }
}

// ------------------------------------------------------------------------------
// Export
// ------------------------------------------------------------------------------

export const wsHub = new WebSocketHub()
