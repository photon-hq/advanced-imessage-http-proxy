/**
 * Find My Friends Normalization
 *
 * The kit SDK returns Apple-shaped snake_case payloads. We normalize them into
 * the proxy's camelCase contract and turn the [lat, lng] tuple into a named
 * object so consumers never have to remember the order.
 */

export interface FindMyLocation {
    handle: string | null
    coordinates: { latitude: number; longitude: number }
    longAddress: string | null
    shortAddress: string | null
    title: string | null
    subtitle: string | null
    lastUpdated: number
    isLocating: boolean
    status: "live" | "legacy" | "shallow"
    expiry: number | null
}

interface RawLocation {
    handle?: string | null
    coordinates?: [number, number] | null
    long_address?: string | null
    short_address?: string | null
    title?: string | null
    subtitle?: string | null
    last_updated?: number
    is_locating_in_progress?: 0 | 1 | boolean
    status?: "live" | "legacy" | "shallow"
    expiry?: number | null
}

export function normalizeLocation(raw: RawLocation): FindMyLocation {
    const [latitude, longitude] = raw.coordinates ?? [0, 0]
    return {
        handle: raw.handle ?? null,
        coordinates: { latitude, longitude },
        longAddress: raw.long_address ?? null,
        shortAddress: raw.short_address ?? null,
        title: raw.title ?? null,
        subtitle: raw.subtitle ?? null,
        lastUpdated: raw.last_updated ?? 0,
        isLocating: Boolean(raw.is_locating_in_progress),
        status: raw.status ?? "shallow",
        expiry: raw.expiry ?? null,
    }
}
