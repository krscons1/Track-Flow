import { writeFile, mkdir, unlink, readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

interface UploadedFile {
  id: string
  originalName: string
  fileName: string
  mimeType: string
  size: number
  path: string
  uploadedBy: string
  uploadedAt: Date
}

export class FileStorageService {
  private uploadDir: string

  constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads")
    this.ensureUploadDir()
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true })
    }

    // Create subdirectories
    const subdirs = ["avatars", "attachments", "reports"]
    for (const subdir of subdirs) {
      const dirPath = path.join(this.uploadDir, subdir)
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true })
      }
    }
  }

  async uploadFile(
    file: File,
    category: "avatars" | "attachments" | "reports",
    uploadedBy: string,
  ): Promise<UploadedFile> {
    try {
      const fileId = uuidv4()
      const fileExtension = path.extname(file.name)
      const fileName = `${fileId}${fileExtension}`
      const filePath = path.join(this.uploadDir, category, fileName)

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Write file to disk
      await writeFile(filePath, buffer)

      const uploadedFile: UploadedFile = {
        id: fileId,
        originalName: file.name,
        fileName,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        uploadedBy,
        uploadedAt: new Date(),
      }

      return uploadedFile
    } catch (error) {
      console.error("File upload error:", error)
      throw new Error("Failed to upload file")
    }
  }

  async deleteFile(fileName: string, category: "avatars" | "attachments" | "reports"): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, category, fileName)
      if (existsSync(filePath)) {
        await unlink(filePath)
        return true
      }
      return false
    } catch (error) {
      console.error("File deletion error:", error)
      return false
    }
  }

  async getFile(fileName: string, category: "avatars" | "attachments" | "reports"): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.uploadDir, category, fileName)
      if (existsSync(filePath)) {
        return await readFile(filePath)
      }
      return null
    } catch (error) {
      console.error("File retrieval error:", error)
      return null
    }
  }

  getFileUrl(fileName: string, category: "avatars" | "attachments" | "reports"): string {
    return `/api/files/${category}/${fileName}`
  }

  validateFile(file: File, category: "avatars" | "attachments" | "reports"): { valid: boolean; error?: string } {
    const maxSizes = {
      avatars: 5 * 1024 * 1024, // 5MB
      attachments: 50 * 1024 * 1024, // 50MB
      reports: 10 * 1024 * 1024, // 10MB
    }

    const allowedTypes = {
      avatars: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      attachments: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/csv",
      ],
      reports: ["application/pdf"],
    }

    if (file.size > maxSizes[category]) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizes[category] / (1024 * 1024)}MB limit`,
      }
    }

    if (!allowedTypes[category].includes(file.type)) {
      return {
        valid: false,
        error: "File type not allowed",
      }
    }

    return { valid: true }
  }
}

export const fileStorage = new FileStorageService()
