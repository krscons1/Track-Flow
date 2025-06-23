import { type NextRequest, NextResponse } from "next/server"
import { fileStorage } from "@/lib/storage/file-storage"
import { getServerSession } from "@/lib/server-only/auth"
import { FileModel } from "@/lib/server-only/models/File"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session._id || "Unknown"

    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = formData.get("category") as "avatars" | "attachments" | "reports"
    const projectId = formData.get("projectId") as string
    const taskId = formData.get("taskId") as string
    const teamId = formData.get("teamId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file
    const validation = fileStorage.validateFile(file, category)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Upload file
    const uploadedFile = await fileStorage.uploadFile(file, category, userId)

    // Save file metadata to database
    const fileRecord: any = {
      id: uploadedFile.id,
      originalName: uploadedFile.originalName,
      fileName: uploadedFile.fileName,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size,
      uploadedBy: userId,
      uploadedAt: uploadedFile.uploadedAt,
      category,
    }
    if (projectId) fileRecord.projectId = projectId
    if (taskId) fileRecord.taskId = taskId
    if (teamId) fileRecord.teamId = teamId
    await FileModel.create(fileRecord)

    return NextResponse.json({
      id: uploadedFile.id,
      name: uploadedFile.originalName,
      fileName: uploadedFile.fileName,
      url: fileStorage.getFileUrl(uploadedFile.fileName, category),
      size: uploadedFile.size,
      type: uploadedFile.mimeType,
      uploadedBy: userId,
      uploadedAt: uploadedFile.uploadedAt,
      category,
      projectId: projectId || undefined,
      teamId: teamId || undefined,
      taskId: taskId || undefined,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
