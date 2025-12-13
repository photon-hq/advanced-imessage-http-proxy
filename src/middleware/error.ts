import { ConfigError } from "./config"

// ------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------

export interface ApiError {
    status: number
    ok: false
    error: {
        code: string
        message: string
        detail?: unknown
    }
}

// ------------------------------------------------------------------------------
// Error Mapper
// ------------------------------------------------------------------------------

export function mapError(error: unknown): ApiError {
    // Config Error
    if (error instanceof ConfigError) {
        return {
            status: 400,
            ok: false,
            error: { code: "CONFIG_ERROR", message: error.message },
        }
    }

    // Elysia Validation Error
    const validationErr = error as any
    if (validationErr?.type === "validation" || validationErr?.code === "VALIDATION") {
        // Extract clean message from Elysia validation error
        const message = validationErr.all?.[0]?.summary 
            || validationErr.summary 
            || validationErr.errors?.[0]?.summary
            || "Validation failed"
        return {
            status: 400,
            ok: false,
            error: { code: "VALIDATION_ERROR", message },
        }
    }

    // Upstream API Error (duck typing for axios errors)
    const axiosErr = error as any
    if (axiosErr?.isAxiosError || axiosErr?.response?.status) {
        let responseData = axiosErr.response?.data
        
        // If response data is Buffer, try to parse as JSON
        if (responseData && (Buffer.isBuffer(responseData) || responseData?.type === "Buffer")) {
            try {
                const buf = Buffer.isBuffer(responseData) ? responseData : Buffer.from(responseData.data)
                responseData = JSON.parse(buf.toString("utf-8"))
            } catch (e) {
                // Parse failed, keep original
            }
        }
        
        return {
            status: axiosErr.response?.status ?? 502,
            ok: false,
            error: {
                code: "UPSTREAM_ERROR",
                message: responseData?.error?.message ?? responseData?.message ?? axiosErr.message,
                detail: responseData,
            },
        }
    }

    // Generic Error
    if (error instanceof Error) {
        return {
            status: 500,
            ok: false,
            error: { code: "INTERNAL_ERROR", message: error.message },
        }
    }

    // Unknown Error
    return {
        status: 500,
        ok: false,
        error: { code: "UNKNOWN_ERROR", message: "An unknown error occurred" },
    }
}
