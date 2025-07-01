import { type NextRequest, NextResponse } from "next/server"
import { fileStorage } from "@/lib/storage/file-storage"
import { FileModel } from "@/lib/server-only/models/File"

export async function GET(request: NextRequest, { params }: { params: { category: string; filename: string } }) {
  try {
    const { category, filename } = params

    if (!["avatars", "attachments", "reports"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const file = await fileStorage.getFile(filename, category as any)
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Determine content type based on file extension
    const extension = filename.split(".").pop()?.toLowerCase()
    const contentTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      txt: "text/plain",
      csv: "text/csv",
    }

    const contentType = contentTypes[extension || ""] || "application/octet-stream"

    const fileRecord = await FileModel.findByFileNameAndCategory(filename, category)
    const originalName = fileRecord?.originalName || filename

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(originalName)}"`
      },
    })
  } catch (error) {
    console.error("File retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { category: string; filename: string } }) {
  try {
    const { category, filename } = params
    if (!["avatars", "attachments", "reports"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }
    const deleted = await fileStorage.deleteFile(filename, category as any)
    if (!deleted) {
      return NextResponse.json({ error: "File not found or could not be deleted" }, { status: 404 })
    }
    const dbDeleted = await FileModel.deleteByFileNameAndCategory(filename, category)
    if (!dbDeleted) {
      return NextResponse.json({ error: "File deleted from storage but not from database" }, { status: 500 })
    }
    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("File deletion error:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
