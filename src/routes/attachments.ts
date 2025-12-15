/**
 * Attachment Routes
 */
import { t } from "elysia"
import { createHandler, withSdk } from "../core/auth"

export function setupAttachmentRoutes(app: any): void {
    // GET /attachments/:id - Download attachment
    app.get("/attachments/:id", createHandler(async (auth, { params }) => {
        const data: any = await withSdk(auth, sdk => sdk.attachments.downloadAttachment(params.id))
        return new Response(data, { headers: { "Content-Type": "application/octet-stream" } })
    }), {
        params: t.Object({
            id: t.String({ description: "Attachment ID (from message data)" }),
        }),
        detail: { tags: ["Attachments"], summary: "Download attachment" },
    })

    // GET /attachments/:id/info - Get attachment info
    app.get("/attachments/:id/info", createHandler(async (auth, { params }) => {
        const att: any = await withSdk(auth, sdk => sdk.attachments.getAttachment(params.id))
        return {
            ok: true,
            data: { id: att.guid, name: att.transferName, size: att.totalBytes, type: att.mimeType }
        }
    }), {
        params: t.Object({
            id: t.String({ description: "Attachment ID (from message data)" }),
        }),
        response: t.Object({
            ok: t.Literal(true),
            data: t.Object({
                id: t.String(),
                name: t.Nullable(t.String()),
                size: t.Number(),
                type: t.Nullable(t.String()),
            }),
        }),
        detail: { tags: ["Attachments"], summary: "Get attachment info" },
    })
}
