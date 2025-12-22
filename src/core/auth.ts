/**
 * Authentication Module
 */
import { sdkPool } from "./sdk-pool"
import { mapError } from "../middleware/error"
import {AdvancedIMessageKit} from "@photon-ai/advanced-imessage-kit";

export interface Auth {
    serverUrl: string
    apiKey: string
}

/**
 * Parse Authorization header.
 * The token packs `serverUrl` and `apiKey` as base64("url|key") so clients only need
 * a single Bearer token and we avoid dealing with URL special characters in headers.
 */
export function parseAuth(authorization: string | undefined): Auth | null {
    if (!authorization?.startsWith("Bearer ")) return null
    try {
        const token = authorization.slice(7)
        const decoded = Buffer.from(token, "base64").toString("utf-8")
        const [serverUrl, apiKey] = decoded.split("|")
        if (!serverUrl || !apiKey) return null
        return { serverUrl, apiKey }
    } catch {
        return null
    }
}

/** Convert simple address to chatGuid */
export function toChatGuid(to: string): string {
    if (to.startsWith("group:")) return `any;+;${to.slice(6)}`
    return `any;-;${to}`
}

/** Extract simple address from chatGuid */
export function fromChatGuid(guid: string): string {
    if (guid.includes(";+;")) return `group:${guid.split(";+;")[1]}`
    return guid.split(";-;")[1] || guid
}

/** Execute SDK operation */
export async function withSdk<T>(auth: Auth, handler: (sdk: AdvancedIMessageKit) => Promise<T>): Promise<T> {
    const sdk = await sdkPool.acquire(auth.serverUrl, auth.apiKey)
    try {
        await sdkPool.ensureConnected(auth.serverUrl, auth.apiKey)
        return await handler(sdk)
    } finally {
        sdkPool.release(auth.serverUrl, auth.apiKey)
    }
}

/** Create route handler with auth */
export function createHandler(handler: (auth: Auth, ctx: any) => Promise<any>) {
    return async (ctx: any) => {
        const auth = parseAuth(ctx.headers.authorization)
        if (!auth) {
            ctx.set.status = 401
            return { ok: false, error: { code: "UNAUTHORIZED", message: "Invalid Authorization header" } }
        }
        // Ensure query exists
        ctx.query = ctx.query || {}
        try {
            return await handler(auth, ctx)
        } catch (error) {
            const mapped = mapError(error)
            ctx.set.status = mapped.status
            return { ok: false, error: mapped.error }
        }
    }
}
