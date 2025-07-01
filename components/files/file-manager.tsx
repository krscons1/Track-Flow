"use client"

import type React from "react"

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
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
  fileName: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: string
  category: "avatars" | "attachments" | "reports"
  url: string
  uploaderName?: string
  originalName?: string
}

interface FileManagerProps {
  projectId?: string
  teamId?: string
  taskId?: string
  category: "avatars" | "attachments" | "reports"
  allowUpload?: boolean
  minimal?: boolean
}

const FileManager = forwardRef(function FileManager({ projectId, teamId, taskId, category, allowUpload = true, minimal = false }: FileManagerProps, ref) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)

  const fetchFiles = async () => {
    if (!projectId && !teamId) return;
    try {
      let url = "/api/files/list?"
      if (teamId) url += `teamId=${teamId}`
      else if (projectId) url += `projectId=${projectId}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      }
    } catch (e) {
      // Optionally handle error
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [projectId, teamId])

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
        if (projectId) formData.append("projectId", projectId)
        if (teamId) formData.append("teamId", teamId)
        if (taskId) formData.append("taskId", taskId)

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
            name: uploadedFile.name,
            fileName: uploadedFile.fileName,
            type: uploadedFile.type,
            size: uploadedFile.size,
            uploadedBy: "Current User",
            uploadedAt: new Date().toISOString(),
            category,
            url: uploadedFile.url,
            uploaderName: uploadedFile.uploaderName,
            originalName: uploadedFile.originalName,
          }

          setFiles((prev) => [newFile, ...prev])
          toast({
            title: "Success",
            description: `${uploadedFile.name} uploaded successfully`,
          })
          await fetchFiles()
        } else {
          // Show backend error message if available
          let errorMsg = `Failed to upload ${file.name}`;
          try {
            const err = await response.json();
            if (err && err.error) errorMsg = err.error;
          } catch {}
          throw new Error(errorMsg);
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : `Failed to upload ${file.name}`,
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

  const deleteFile = async (fileId: string, fileCategory?: string, fileName?: string) => {
    try {
      if (!fileCategory || !fileName) return;
      const response = await fetch(`/api/files/${fileCategory}/${fileName}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setFiles(files.filter((f) => f.id !== fileId))
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
        await fetchFiles()
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
    link.download = file.originalName || file.name || file.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileIcon = (type: string | undefined) => {
    if (typeof type === "string" && type.startsWith("image/")) {
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
    (file) =>
      (searchQuery === "" || file.name?.toLowerCase?.().includes(searchQuery.toLowerCase())) &&
      file.category === category
  )

  const deleteAllFiles = async () => {
    if (!projectId && !teamId) return;
    try {
      let url = "/api/files/list?"
      if (teamId) url += `teamId=${teamId}`
      else if (projectId) url += `projectId=${projectId}`
      const res = await fetch(url, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Success", description: "All files deleted." })
        await fetchFiles()
      } else {
        toast({ title: "Error", description: "Failed to delete all files.", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete all files.", variant: "destructive" })
    }
    setShowDeleteAllConfirm(false)
  }

  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      fileInputRef.current?.click();
    }
  }));

  if (minimal) {
    return (
      <div>
        {/* Upload button is now controlled by parent via ref */}
        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && isUploading && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{
                Math.round(
                  Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.values(uploadProgress).length
                )
              }%</span>
            </div>
            <Progress value={
              Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.values(uploadProgress).length
            } className="h-2" />
          </div>
        )}
        {/* Files List */}
        <div className="space-y-3">
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
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors animate-fade-in shadow-sm"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center space-x-3 w-full">
                  {getFileIcon(file.type)}
                  <span className="font-medium text-gray-900 truncate w-full">{file.originalName || file.name || file.fileName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(file.url, "_blank")}> <Eye className="h-4 w-4 mr-2" /> Preview </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadFile(file)}> <Download className="h-4 w-4 mr-2" /> Download </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteFile(file.id, file.category, file.fileName)} className="text-red-600 hover:text-red-700"> <Trash2 className="h-4 w-4 mr-2" /> Delete </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
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
      </div>
    )
  }

  return (
    <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <File className="h-5 w-5 mr-2" />
            File Manager
          </CardTitle>
          <div className="flex items-center gap-2">
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
            {files.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteAllConfirm(true)}
                disabled={isUploading}
              >
                Delete All Files
              </Button>
            )}
          </div>
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
        {Object.keys(uploadProgress).length > 0 && isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{
                Math.round(
                  Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.values(uploadProgress).length
                )
              }%</span>
            </div>
            <Progress value={
              Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.values(uploadProgress).length
            } className="h-2" />
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
                    <p className="font-medium text-gray-900">{file.originalName || file.name || file.fileName}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>by {file.uploaderName || "Unknown"}</span>
                      <span>•</span>
                      <span>{getTimeAgo(file.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-gray-100 text-gray-800">{
                    typeof file.type === "string" && file.type.includes("/")
                      ? file.type.split("/")[1].toUpperCase()
                      : "FILE"
                  }</Badge>
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
                      <DropdownMenuItem onClick={() => deleteFile(file.id, file.category, file.fileName)} className="text-red-600 hover:text-red-700">
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

        {/* Delete All Confirmation Dialog */}
        {showDeleteAllConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4">Delete All Files?</h2>
              <p className="mb-6">Are you sure you want to delete <b>all files</b>? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteAllConfirm(false)}>Cancel</Button>
                <Button variant="destructive" onClick={deleteAllFiles}>Delete All</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default FileManager;
