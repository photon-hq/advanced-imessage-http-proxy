// ------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------

export interface GatewayConfig {
    serverUrl: string
    apiKey: string
}

// ------------------------------------------------------------------------------
// Errors
// ------------------------------------------------------------------------------

export class ConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ConfigError"
    }
}

// ------------------------------------------------------------------------------
// Extractor
// ------------------------------------------------------------------------------

export function extractConfigFromQuery(query: Record<string, string | undefined>): GatewayConfig {
    const serverUrl = query["serverUrl"]
    const apiKey = query["apiKey"]

    if (!serverUrl) {
        throw new ConfigError("serverUrl query param required")
    }

    if (!apiKey) {
        throw new ConfigError("apiKey query param required")
    }

    return { serverUrl, apiKey }
}
