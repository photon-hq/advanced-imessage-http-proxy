/**
 * Find My Watch Example
 *
 * Subscribes to real-time location updates from friends who are sharing their
 * location with you. The proxy forwards Apple's `new-findmy-location` event,
 * normalized into the same camelCase shape as `GET /icloud/friends`.
 *
 * Apple auto-refreshes location every ~30 seconds while sharing is active —
 * but if nobody moves, Apple may go quiet for minutes. To make this script
 * useful for live testing, we ALSO poll `GET /icloud/friends?refresh=true`
 * every 10 seconds so you can see state changes (start/stop sharing, status
 * transitions) even when coordinates aren't moving.
 *
 * Output legend:
 *   PUSH  → real-time event from Socket.IO  (best signal that the link works)
 *   POLL  → 10s REST refresh                 (fallback for stationary friends)
 *   DIFF  → poll detected a change vs. last snapshot
 */

import { io } from "socket.io-client"

const PROXY_URL = process.env.PROXY_URL || "https://imessage-swagger.photon.codes"
const SERVER_URL = process.env.SERVER_URL || "https://your-server.imsgd.photon.codes/"
const API_KEY = process.env.API_KEY || "your-api-key"
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 10_000)

const token = Buffer.from(`${SERVER_URL}|${API_KEY}`).toString("base64")
const socket = io(PROXY_URL, { auth: { token } })

interface FindMyLocation {
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

const ts = () => new Date().toISOString().slice(11, 19)

const fmtLoc = (loc: FindMyLocation): string => {
    const { latitude, longitude } = loc.coordinates
    const addr = loc.shortAddress || loc.title || ""
    return `${loc.handle} [${loc.status}] ${latitude.toFixed(5)},${longitude.toFixed(5)}${addr ? `  ${addr}` : ""}`
}

// Snapshot keyed by handle so polls can spot changes between rounds.
const snapshot = new Map<string, FindMyLocation>()

const sigOf = (loc: FindMyLocation): string =>
    `${loc.status}|${loc.coordinates.latitude}|${loc.coordinates.longitude}|${loc.lastUpdated}`

async function pollOnce(): Promise<void> {
    try {
        const res = await fetch(`${PROXY_URL}/icloud/friends?refresh=true`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
            console.log(`[${ts()}] POLL  HTTP ${res.status}`)
            return
        }
        const { data } = (await res.json()) as { data: FindMyLocation[] }
        const seen = new Set<string>()

        for (const loc of data) {
            const key = loc.handle ?? ""
            seen.add(key)
            const prev = snapshot.get(key)
            if (!prev) {
                console.log(`[${ts()}] DIFF  +start  ${fmtLoc(loc)}`)
            } else if (sigOf(prev) !== sigOf(loc)) {
                console.log(`[${ts()}] DIFF  update  ${fmtLoc(loc)}`)
            }
            snapshot.set(key, loc)
        }

        // Detect handles that disappeared (stopped sharing).
        const previousKeys = Array.from(snapshot.keys())
        for (const key of previousKeys) {
            if (!seen.has(key)) {
                console.log(`[${ts()}] DIFF  -stop   ${key}`)
                snapshot.delete(key)
            }
        }

        console.log(`[${ts()}] POLL  ${data.length} friend(s) sharing  (next in ${POLL_INTERVAL_MS / 1000}s)`)
    } catch (err) {
        console.log(`[${ts()}] POLL  error: ${(err as Error).message}`)
    }
}

socket.on("ready", () => {
    console.log(`[${ts()}] CONNECT  socket ready  (proxy=${PROXY_URL})`)
    pollOnce() // initial baseline
    setInterval(pollOnce, POLL_INTERVAL_MS)
})

socket.on("new-findmy-location", (loc: FindMyLocation) => {
    const key = loc.handle ?? ""
    const prev = snapshot.get(key)
    snapshot.set(key, loc)
    const tag = !prev ? "+start" : sigOf(prev) === sigOf(loc) ? "noop  " : "update"
    console.log(`[${ts()}] PUSH  ${tag} ${fmtLoc(loc)}`)
})

socket.on("error", (err) => console.error(`[${ts()}] ERROR  ${err}`))
socket.on("disconnect", (reason) => console.log(`[${ts()}] DISCONNECT  ${reason}`))

console.log(`[${ts()}] Watching for location updates...  (Ctrl-C to stop)`)
console.log(`[${ts()}] PUSH = realtime, POLL = ${POLL_INTERVAL_MS / 1000}s refresh fallback`)
