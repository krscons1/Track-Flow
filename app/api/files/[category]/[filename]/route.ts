import { type NextRequest, NextResponse } from "next/server"
import { fileStorage } from "@/lib/storage/file-storage"

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

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("File retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 })
  }
}
