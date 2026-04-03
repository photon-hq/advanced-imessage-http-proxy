import { ConfigError } from "./config"

// ------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------

export type ErrorCategory =
    | "auth"
    | "validation"
    | "not_found"
    | "upstream"
    | "upstream_unreachable"
    | "rate_limit"
    | "config"
    | "internal"

export interface ApiError {
    status: number
    ok: false
    error: {
        code: string
        message: string
        category: ErrorCategory
        retryable: boolean
        suggested_action: string
        request_id?: string
        detail?: unknown
        retry_after?: number
    }
}

// ------------------------------------------------------------------------------
// Suggested Actions
// ------------------------------------------------------------------------------

const SUGGESTED_ACTIONS: Record<string, string> = {
    UNAUTHORIZED: "Token must be base64-encoded 'serverUrl|apiKey'. Example: echo -n 'https://your-server|your-key' | base64",
    VALIDATION_ERROR: "Check the request body and query parameters against the API schema.",
    CONFIG_ERROR: "Server URL and API key are required in the Authorization header as base64(serverUrl|apiKey).",
    CHAT_NOT_FOUND: "No chat exists with this identifier. To start a new conversation, send a message first — the chat is created automatically.",
    MESSAGE_NOT_FOUND: "No message found with this GUID. Message GUIDs are returned in send and list responses.",
    POLL_NOT_FOUND: "Poll not found. Use the poll GUID returned from POST /polls.",
    SCHEDULED_MESSAGE_NOT_FOUND: "Scheduled message not found. Use the ID returned from POST /scheduled-messages.",
    ATTACHMENT_NOT_FOUND: "Attachment not found. Use the attachment ID from message data.",
    UPSTREAM_UNREACHABLE: "The iMessage server is not responding. Verify it is running and the URL is correct. Retry in 60 seconds.",
    UPSTREAM_TIMEOUT: "The iMessage server did not respond in time. This can happen with group operations. Retry in 30 seconds.",
    RATE_LIMITED: "Rate limited by the iMessage server. Wait and retry with exponential backoff.",
    UPSTREAM_ERROR: "The iMessage server returned an error. Check the detail field for more information.",
    UPSTREAM_SERVER_ERROR: "The iMessage server encountered an internal error. Retry once after a short delay.",
    INTERNAL_ERROR: "An unexpected error occurred. Retry once. If this persists, report the request_id.",
    UNKNOWN_ERROR: "An unknown error occurred. Retry once. If this persists, report the request_id.",
}

function getSuggestedAction(code: string, fallback?: string): string {
    return fallback || SUGGESTED_ACTIONS[code] || SUGGESTED_ACTIONS.UNKNOWN_ERROR!
}

// ------------------------------------------------------------------------------
// Connection Error Codes (no HTTP response received)
// ------------------------------------------------------------------------------

export const UNREACHABLE_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH"])
export const TIMEOUT_CODES = new Set(["ETIMEDOUT", "ECONNABORTED"])

export function classifyConnectionError(error: unknown): "unreachable" | "timeout" | null {
    const errCode = (error as any)?.code as string | undefined
    if (errCode && UNREACHABLE_CODES.has(errCode)) return "unreachable"
    if (errCode && TIMEOUT_CODES.has(errCode)) return "timeout"
    const msg = error instanceof Error ? error.message : String(error)
    for (const code of UNREACHABLE_CODES) if (msg.includes(code)) return "unreachable"
    for (const code of TIMEOUT_CODES) if (msg.includes(code)) return "timeout"
    return null
}

// ------------------------------------------------------------------------------
// Error Mapper
// ------------------------------------------------------------------------------

export function mapError(error: unknown): ApiError {
    if (error instanceof ConfigError) {
        return {
            status: 400,
            ok: false,
            error: {
                code: "CONFIG_ERROR",
                message: error.message,
                category: "config",
                retryable: false,
                suggested_action: getSuggestedAction("CONFIG_ERROR"),
            },
        }
    }

    const validationErr = error as any
    if (validationErr?.type === "validation" || validationErr?.code === "VALIDATION") {
        const message = validationErr.all?.[0]?.summary 
            || validationErr.summary 
            || validationErr.errors?.[0]?.summary
            || "Validation failed"
        return {
            status: 400,
            ok: false,
            error: {
                code: "VALIDATION_ERROR",
                message,
                category: "validation",
                retryable: false,
                suggested_action: getSuggestedAction("VALIDATION_ERROR"),
            },
        }
    }

    const axiosErr = error as any
    if (axiosErr?.isAxiosError || axiosErr?.response?.status) {
        const connType = classifyConnectionError(error)

        if (connType === "unreachable") {
            return {
                status: 502,
                ok: false,
                error: {
                    code: "UPSTREAM_UNREACHABLE",
                    message: `Cannot connect to iMessage server: ${axiosErr.message}`,
                    category: "upstream_unreachable",
                    retryable: true,
                    suggested_action: getSuggestedAction("UPSTREAM_UNREACHABLE"),
                    retry_after: 60,
                },
            }
        }

        if (connType === "timeout") {
            return {
                status: 504,
                ok: false,
                error: {
                    code: "UPSTREAM_TIMEOUT",
                    message: `iMessage server request timed out: ${axiosErr.message}`,
                    category: "upstream",
                    retryable: true,
                    suggested_action: getSuggestedAction("UPSTREAM_TIMEOUT"),
                    retry_after: 30,
                },
            }
        }

        let responseData = axiosErr.response?.data
        if (responseData && (Buffer.isBuffer(responseData) || responseData?.type === "Buffer")) {
            try {
                const buf = Buffer.isBuffer(responseData) ? responseData : Buffer.from(responseData.data)
                responseData = JSON.parse(buf.toString("utf-8"))
            } catch {
                // Parse failed, keep original
            }
        }

        const upstreamStatus: number | undefined = axiosErr.response?.status
        const upstreamMessage = responseData?.error?.message ?? responseData?.message ?? axiosErr.message

        if (upstreamStatus === 429) {
            const rawRetryAfter = axiosErr.response?.headers?.["retry-after"]
            const retryAfterSeconds = Number(rawRetryAfter)
            const retryAfterDate = Date.parse(String(rawRetryAfter))
            const retryAfter = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                ? retryAfterSeconds
                : Number.isFinite(retryAfterDate)
                    ? Math.max(0, Math.ceil((retryAfterDate - Date.now()) / 1000))
                    : 30
            return {
                status: 429,
                ok: false,
                error: {
                    code: "RATE_LIMITED",
                    message: `Rate limited by iMessage server: ${upstreamMessage}`,
                    category: "rate_limit",
                    retryable: true,
                    suggested_action: `Rate limited. Wait ${retryAfter} seconds and retry with exponential backoff.`,
                    retry_after: retryAfter,
                },
            }
        }

        if (upstreamStatus === 404) {
            return {
                status: 404,
                ok: false,
                error: {
                    code: "NOT_FOUND",
                    message: upstreamMessage || "The requested resource was not found on the iMessage server",
                    category: "not_found",
                    retryable: false,
                    suggested_action: "The resource does not exist on the iMessage server. Verify the identifier.",
                    detail: responseData,
                },
            }
        }

        if (upstreamStatus && upstreamStatus >= 500) {
            return {
                status: upstreamStatus,
                ok: false,
                error: {
                    code: "UPSTREAM_SERVER_ERROR",
                    message: upstreamMessage || "The iMessage server encountered an internal error",
                    category: "upstream",
                    retryable: true,
                    suggested_action: getSuggestedAction("UPSTREAM_SERVER_ERROR"),
                    detail: responseData,
                    retry_after: 10,
                },
            }
        }

        return {
            status: upstreamStatus ?? 502,
            ok: false,
            error: {
                code: "UPSTREAM_ERROR",
                message: upstreamMessage,
                category: "upstream",
                retryable: false,
                suggested_action: getSuggestedAction("UPSTREAM_ERROR"),
                detail: responseData,
            },
        }
    }

    if (error instanceof Error) {
        return {
            status: 500,
            ok: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "An internal error occurred",
                category: "internal",
                retryable: true,
                suggested_action: getSuggestedAction("INTERNAL_ERROR"),
            },
        }
    }

    return {
        status: 500,
        ok: false,
        error: {
            code: "UNKNOWN_ERROR",
            message: "An unknown error occurred",
            category: "internal",
            retryable: true,
            suggested_action: getSuggestedAction("UNKNOWN_ERROR"),
        },
    }
}
