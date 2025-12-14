/**
 * Attachment Routes
 */
import { createHandler, withSdk } from "../core/auth"

export function setupAttachmentRoutes(app: any): void {
    // GET /attachments/:id - Download attachment
    app.get("/attachments/:id", createHandler(async (auth, { params }) => {
        const data: any = await withSdk(auth, sdk => sdk.attachments.downloadAttachment(params.id))
        return new Response(data, { headers: { "Content-Type": "application/octet-stream" } })
    }), { detail: { tags: ["Attachments"], summary: "Download attachment" } })

    // GET /attachments/:id/info - Get attachment info
    app.get("/attachments/:id/info", createHandler(async (auth, { params }) => {
        const att: any = await withSdk(auth, sdk => sdk.attachments.getAttachment(params.id))
        return {
            ok: true,
            data: { id: att.guid, name: att.transferName, size: att.totalBytes, type: att.mimeType }
        }
    }), { detail: { tags: ["Attachments"], summary: "Get attachment info" } })
}
