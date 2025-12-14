import { AdvancedIMessageKit } from "@photon-ai/advanced-imessage-kit"

// ------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------

interface SDKEntry {
    sdk: AdvancedIMessageKit
    refCount: number
    lastUsed: number
    connected: boolean
}

interface PoolStats {
    total: number
    connections: Array<{
        server: string
        refCount: number
        lastUsed: number
        connected: boolean
    }>
}

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

const CLEANUP_DELAY_MS = 5 * 60 * 1000

// ------------------------------------------------------------------------------
// SDK Pool
// ------------------------------------------------------------------------------

class SDKPool {
    private instances = new Map<string, SDKEntry>()
    private pending = new Map<string, Promise<AdvancedIMessageKit>>()
    private cleanupTimers = new Map<string, Timer>()

    // ------------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------------

    async acquire(serverUrl: string, apiKey: string): Promise<AdvancedIMessageKit> {
        const key = this.getKey(serverUrl, apiKey)
        this.cancelCleanup(key)

        // Wait for pending creation
        if (this.pending.has(key)) {
            const sdk = await this.pending.get(key)!
            this.incrementRef(key)
            return sdk
        }

        // Return existing instance
        if (this.instances.has(key)) {
            this.incrementRef(key)
            return this.instances.get(key)!.sdk
        }

        // Create new instance
        const promise = this.createSDK(serverUrl, apiKey)
        this.pending.set(key, promise)

        try {
            const sdk = await promise
            this.instances.set(key, {
                sdk,
                refCount: 1,
                lastUsed: Date.now(),
                connected: false,
            })
            return sdk
        } finally {
            this.pending.delete(key)
        }
    }

    release(serverUrl: string, apiKey: string): void {
        const key = this.getKey(serverUrl, apiKey)
        const entry = this.instances.get(key)

        if (!entry) return

        entry.refCount--
        entry.lastUsed = Date.now()

        if (entry.refCount <= 0) {
            this.scheduleCleanup(key)
        }
    }

    async ensureConnected(serverUrl: string, apiKey: string): Promise<void> {
        const key = this.getKey(serverUrl, apiKey)
        const entry = this.instances.get(key)

        if (!entry || entry.connected) return

        await entry.sdk.connect()
        entry.connected = true
    }

    getStats(): PoolStats {
        const connections = Array.from(this.instances.entries()).map(([key, entry]) => {
            const serverUrl = key.split("::")[0] ?? ""
            // Mask server URL for security (only show domain). If parsing fails,
            // fall back to the raw serverUrl string.
            let url = serverUrl
            try {
                url = new URL(serverUrl).hostname
            } catch {
                // Ignore URL parse errors and keep original string
            }
            return {
                server: url,
                refCount: entry.refCount,
                lastUsed: entry.lastUsed,
                connected: entry.connected,
            }
        })

        return { total: this.instances.size, connections }
    }

    // ------------------------------------------------------------------------
    // Private Methods
    // ------------------------------------------------------------------------

    private async createSDK(serverUrl: string, apiKey: string): Promise<AdvancedIMessageKit> {
        return new AdvancedIMessageKit({ serverUrl, apiKey })
    }

    private incrementRef(key: string): void {
        const entry = this.instances.get(key)

        if (!entry) return

        entry.refCount++
        entry.lastUsed = Date.now()
    }

    private scheduleCleanup(key: string): void {
        const timer = setTimeout(() => {
            const entry = this.instances.get(key)

            if (entry && entry.refCount <= 0) {
                entry.sdk.close()
                this.instances.delete(key)
            }
        }, CLEANUP_DELAY_MS)

        this.cleanupTimers.set(key, timer)
    }

    private cancelCleanup(key: string): void {
        const timer = this.cleanupTimers.get(key)

        if (!timer) return

        clearTimeout(timer)
        this.cleanupTimers.delete(key)
    }

    private getKey(serverUrl: string, apiKey: string): string {
        return `${serverUrl}::${apiKey}`
    }
}

// ------------------------------------------------------------------------------
// Export
// ------------------------------------------------------------------------------

export const sdkPool = new SDKPool()
