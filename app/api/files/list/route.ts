import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-only/auth"
import { getDatabase } from "@/lib/server-only/mongodb"
import { UserModel } from "@/lib/server-only/models/User"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const teamId = searchParams.get("teamId")
    if (!projectId && !teamId) {
      return NextResponse.json({ error: "Missing projectId or teamId" }, { status: 400 })
    }
    const db = await getDatabase()
    let files
    if (teamId) {
      files = await db.collection("files").find({ teamId }).toArray()
    } else {
      files = await db.collection("files").find({ projectId }).toArray()
    }

    // Get all unique uploader IDs
    const uploaderIds = [...new Set(files.map(f => f.uploadedBy).filter(Boolean))]
    // Fetch user info for all uploader IDs
    const users = await UserModel.findManyByIds(uploaderIds)
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u.name || u.email]))

    // Attach uploader name/email to each file
    files = files.map(f => ({
      ...f,
      uploaderName: userMap[f.uploadedBy] || "Unknown"
    }))

    return NextResponse.json({ files })
  } catch (error) {
    console.error("Get files error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const teamId = searchParams.get("teamId")
    if (!projectId && !teamId) {
      return NextResponse.json({ error: "Missing projectId or teamId" }, { status: 400 })
    }
    const db = await getDatabase()
    let files
    if (teamId) {
      files = await db.collection("files").find({ teamId }).toArray()
      await db.collection("files").deleteMany({ teamId })
    } else {
      files = await db.collection("files").find({ projectId }).toArray()
      await db.collection("files").deleteMany({ projectId })
    }
    // Remove files from storage
    const { fileStorage } = await import("@/lib/storage/file-storage")
    for (const file of files) {
      if (file.fileName && file.category) {
        await fileStorage.deleteFile(file.fileName, file.category)
      }
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete all files error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 