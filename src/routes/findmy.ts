/**
 * Find My Friends Routes
 *
 * Exposes Apple's "Find My Friends" location data over REST. Companion to the
 * `new-findmy-location` Socket.IO event for real-time updates.
 */
import { t } from "elysia"
import { createHandler, withSdk } from "../core/auth"
import { normalizeLocation } from "../core/findmy"

const locationSchema = t.Object({
    handle: t.Nullable(t.String({ description: "Friend's phone or email" })),
    coordinates: t.Object({
        latitude: t.Number(),
        longitude: t.Number(),
    }),
    longAddress: t.Nullable(t.String()),
    shortAddress: t.Nullable(t.String()),
    title: t.Nullable(t.String()),
    subtitle: t.Nullable(t.String()),
    lastUpdated: t.Number({ description: "Apple's reported timestamp (unix)" }),
    isLocating: t.Boolean({ description: "True while Apple is still resolving the position" }),
    status: t.Union([t.Literal("live"), t.Literal("legacy"), t.Literal("shallow")], {
        description: "live = actively shared, legacy = stale snapshot, shallow = partial",
    }),
    expiry: t.Nullable(t.Number({ description: "When the share expires (unix)" })),
})

export function setupFindMyRoutes(app: any): void {
    // GET /icloud/friends - List all friends' locations
    app.get("/icloud/friends", createHandler(async (auth, { query }) => {
        const refresh = query.refresh === "true" || query.refresh === true
        const locations: any[] = await withSdk(auth, sdk =>
            refresh
                ? sdk.icloud.refreshFindMyFriends()
                : sdk.icloud.getFindMyFriends()
        )
        return { ok: true, data: locations.map(normalizeLocation) }
    }), {
        query: t.Object({
            refresh: t.Optional(t.Union([t.Boolean(), t.String()], {
                description: "Pass `true` to force-refresh from Apple before returning",
            })),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Array(locationSchema),
        }),
        detail: {
            tags: ["Find My"],
            summary: "List friends sharing location",
            description: "Returns every friend currently sharing their location with you. " +
                "Pass `?refresh=true` to force a fresh fetch from Apple (otherwise served from cache).",
        },
    })

    // GET /icloud/friends/:handle/sharing - Quick boolean check
    app.get("/icloud/friends/:handle/sharing", createHandler(async (auth, { params }) => {
        const sharing: boolean = await withSdk(auth, sdk =>
            sdk.icloud.isHandleSharingLocation(params.handle)
        )
        return { ok: true, data: { handle: params.handle, sharing } }
    }), {
        params: t.Object({
            handle: t.String({ description: "Phone or email address to check" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                handle: t.String(),
                sharing: t.Boolean(),
            }),
        }),
        detail: {
            tags: ["Find My"],
            summary: "Check if a handle is sharing location",
            description: "Convenience endpoint that returns `{ sharing: true/false }`. " +
                "Useful for gating UI before pulling full location details.",
        },
    })

    // GET /icloud/friends/:handle - Get a single friend's location
    app.get("/icloud/friends/:handle", createHandler(async (auth, { params }) => {
        const raw: any = await withSdk(auth, sdk =>
            sdk.icloud.getLocationForHandle(params.handle)
        )
        return { ok: true, data: raw ? normalizeLocation(raw) : null }
    }), {
        params: t.Object({
            handle: t.String({ description: "Phone (e.g. +14155550123) or email address" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Nullable(locationSchema),
        }),
        detail: {
            tags: ["Find My"],
            summary: "Get one friend's location",
            description: "Returns the location for a specific handle, or `null` if that " +
                "handle isn't currently sharing with you. Reads from cache — call " +
                "`GET /icloud/friends?refresh=true` first if you need a fresher value.",
        },
    })
}
