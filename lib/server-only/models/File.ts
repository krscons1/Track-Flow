import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

export interface FileRecord {
  _id?: ObjectId
  id: string
  originalName: string
  fileName: string
  mimeType: string
  size: number
  uploadedBy: string
  uploadedAt: Date
  category: "avatars" | "attachments" | "reports"
  projectId?: string
  teamId?: string
  taskId?: string
  path: string
}

export class FileModel {
  static async create(file: FileRecord): Promise<FileRecord> {
    const db = await getDatabase()
    const result = await db.collection("files").insertOne(file)
    return { ...file, _id: result.insertedId }
  }

  static async deleteByFileNameAndCategory(fileName: string, category: string): Promise<boolean> {
    const db = await getDatabase()
    const result = await db.collection("files").deleteOne({ fileName, category })
    return result.deletedCount === 1
  }

  static async findByFileNameAndCategory(fileName: string, category: string): Promise<FileRecord | null> {
    const db = await getDatabase()
    return (await db.collection("files").findOne({ fileName, category })) as FileRecord | null
  }
} 