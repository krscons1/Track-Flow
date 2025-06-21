import { type NextRequest, NextResponse } from "next/server"
import { fileStorage } from "@/lib/storage/file-storage"
import { getServerSession } from "@/lib/server-only/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = formData.get("category") as "avatars" | "attachments" | "reports"
    const projectId = formData.get("projectId") as string
    const taskId = formData.get("taskId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file
    const validation = fileStorage.validateFile(file, category)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Upload file
    const uploadedFile = await fileStorage.uploadFile(file, category, session.userId)

    // TODO: Save file metadata to database
    // await FileModel.create({
    //   ...uploadedFile,
    //   projectId: projectId || null,
    //   taskId: taskId || null,
    // })

    return NextResponse.json({
      id: uploadedFile.id,
      name: uploadedFile.originalName,
      url: fileStorage.getFileUrl(uploadedFile.fileName, category),
      size: uploadedFile.size,
      type: uploadedFile.mimeType,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
