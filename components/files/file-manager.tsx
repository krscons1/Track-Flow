"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, File, ImageIcon, FileText, Download, Trash2, Search, Eye, Share, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface FileItem {
  id: string
  name: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
  category: "avatars" | "attachments" | "reports"
  url: string
}

interface FileManagerProps {
  projectId?: string
  taskId?: string
  category: "avatars" | "attachments" | "reports"
  allowUpload?: boolean
}

export default function FileManager({ projectId, taskId, category, allowUpload = true }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "1",
      name: "project-requirements.pdf",
      type: "application/pdf",
      size: 2048576,
      uploadedBy: "John Doe",
      uploadedAt: new Date().toISOString(),
      category: "attachments",
      url: "/api/files/attachments/project-requirements.pdf",
    },
    {
      id: "2",
      name: "wireframes.png",
      type: "image/png",
      size: 1024000,
      uploadedBy: "Jane Smith",
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      category: "attachments",
      url: "/api/files/attachments/wireframes.png",
    },
    {
      id: "3",
      name: "time-report.pdf",
      type: "application/pdf",
      size: 512000,
      uploadedBy: "System",
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      category: "reports",
      url: "/api/files/reports/time-report.pdf",
    },
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    setIsUploading(true)

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const fileId = `upload-${Date.now()}-${i}`

      try {
        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
          toast({
            title: "Upload Error",
            description: validation.error,
            variant: "destructive",
          })
          continue
        }

        // Simulate upload progress
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))

        const formData = new FormData()
        formData.append("file", file)
        formData.append("category", category)
        formData.append("projectId", projectId || "")
        formData.append("taskId", taskId || "")

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const currentProgress = prev[fileId] || 0
            if (currentProgress >= 100) {
              clearInterval(progressInterval)
              return prev
            }
            return { ...prev, [fileId]: Math.min(currentProgress + 10, 100) }
          })
        }, 200)

        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const uploadedFile = await response.json()
          const newFile: FileItem = {
            id: uploadedFile.id,
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedBy: "Current User",
            uploadedAt: new Date().toISOString(),
            category,
            url: uploadedFile.url,
          }

          setFiles((prev) => [newFile, ...prev])
          toast({
            title: "Success",
            description: `${file.name} uploaded successfully`,
          })
        } else {
          throw new Error("Upload failed")
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      } finally {
        setUploadProgress((prev) => {
          const newProgress = { ...prev }
          delete newProgress[fileId]
          return newProgress
        })
      }
    }

    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
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

  const deleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFiles(files.filter((f) => f.id !== fileId))
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const downloadFile = (file: FileItem) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-600" />
    } else if (type === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-600" />
    } else {
      return <File className="h-5 w-5 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const filteredFiles = files.filter(
    (file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()) && file.category === category,
  )

  return (
    <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <File className="h-5 w-5 mr-2" />
            File Manager
          </CardTitle>
          {allowUpload && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([fileId, progress]) => (
              <div key={fileId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ))}
          </div>
        )}

        {/* Files List */}
        <div className="space-y-2">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files found</p>
              {allowUpload && <p className="text-sm">Upload your first file to get started</p>}
            </div>
          ) : (
            filteredFiles.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center space-x-4">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>by {file.uploadedBy}</span>
                      <span>•</span>
                      <span>{getTimeAgo(file.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-gray-100 text-gray-800">{file.type.split("/")[1].toUpperCase()}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(file.url, "_blank")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteFile(file.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept={
            category === "avatars"
              ? "image/*"
              : category === "reports"
                ? ".pdf"
                : "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          }
        />
      </CardContent>
    </Card>
  )
}
