import { randomUUID } from "node:crypto"
import { writeFile, unlink, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

const UPLOAD_DIR = path.join(tmpdir(), "imessage-proxy-uploads")

// ------------------------------------------------------------------------------
// File Operations
// ------------------------------------------------------------------------------

async function ensureUploadDir(): Promise<void> {
    await mkdir(UPLOAD_DIR, { recursive: true })
}

export async function saveUploadedFile(file: File): Promise<string> {
    await ensureUploadDir()

    const ext = path.extname(file.name) || ""
    const filename = `${randomUUID()}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    return filepath
}

export async function cleanupFile(filepath: string): Promise<void> {
    try {
        await unlink(filepath)
    } catch {
        // Ignore cleanup errors
    }
}

// ------------------------------------------------------------------------------
// Helper
// ------------------------------------------------------------------------------

export async function withTempFile<T>(
    file: File,
    fn: (filepath: string) => Promise<T>,
): Promise<T> {
    const filepath = await saveUploadedFile(file)

    try {
        return await fn(filepath)
    } finally {
        await cleanupFile(filepath)
    }
}
