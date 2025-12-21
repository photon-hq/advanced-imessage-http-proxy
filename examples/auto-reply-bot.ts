/**
 * Auto-reply Bot Example
 * 
 * Demonstrates how to listen for incoming messages and send automated replies
 * using the iMessage HTTP Proxy via Socket.IO.
 */

import { io } from "socket.io-client"

// Configuration - replace with your actual values
const PROXY_URL = process.env.PROXY_URL || "https://imessage-swagger.photon.codes"
const SERVER_URL = process.env.SERVER_URL || "https://your-server.imsgd.photon.codes/"
const API_KEY = process.env.API_KEY || "your-api-key"

const token = Buffer.from(`${SERVER_URL}|${API_KEY}`).toString("base64")
const socket = io(PROXY_URL, { auth: { token } })

socket.on("new-message", async (message: any) => {
    // Skip messages sent by ourselves
    if (message.isFromMe) return

    console.log(`Received: "${message.text}" from ${message.handle?.address}`)

    // Extract recipient address from chat GUID
    const chatGuid = message.chats?.[0]?.guid
    if (!chatGuid) return

    const to = chatGuid.split(";-;").pop()

    // Send reply
    const response = await fetch(`${PROXY_URL}/send`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            to,
            text: `You said: "${message.text}"`
        })
    })

    const result = await response.json() as any
    if (result.ok) {
        console.log(`Replied successfully`)
    } else {
        console.error(`Failed to reply:`, result.error)
    }
})

console.log("Listening for messages...")
