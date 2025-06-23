"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Plus, CheckCircle, Clock, Calendar, Paperclip, GripVertical, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import CommentSection from "./comment-section"
import FileManager from "@/components/files/file-manager"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
}

interface Task {
  _id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  estimatedHours: number
  project: string
}

interface Project {
  _id: string
  title: string
  color: string
}

interface Subtask {
  _id: string
  title: string
  description: string
  completed: boolean
  createdAt: string
  assignee?: {
    _id: string
    name: string
  }
}

interface SubtaskManagementContentProps {
  user: User
  task: Task
  project: Project
}

export default function SubtaskManagementContent({ user, task, project }: SubtaskManagementContentProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [newSubtaskDescription, setNewSubtaskDescription] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const fileManagerRef = useRef(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  }

  useEffect(() => {
    loadSubtasks()
  }, [])

  const loadSubtasks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task._id}/subtasks`)
      const data = await response.json()
      if (response.ok) {
        setSubtasks(data.subtasks)
      } else {
        throw new Error(data.error || "Failed to load subtasks")
      }
    } catch (error) {
      console.error("Failed to load subtasks:", error)
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    try {
      const response = await fetch(`/api/tasks/${task._id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSubtaskTitle,
          description: newSubtaskDescription,
        }),
      })
      const data = await response.json()

      if (response.ok) {
        setSubtasks([...subtasks, data.subtask])
        setNewSubtaskTitle("")
        setNewSubtaskDescription("")
        setIsAddingSubtask(false)
        toast({
          title: "Subtask added",
          description: "New subtask has been created successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to add subtask")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const toggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks.find((s) => s._id === subtaskId)
    if (!subtask) return

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !subtask.completed }),
      })
      const data = await response.json()

      if (response.ok) {
        setSubtasks(
          subtasks.map((s) => (s._id === subtaskId ? data.subtask : s)),
        )
      } else {
        throw new Error(data.error || "Failed to update subtask")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  const completedSubtasks = subtasks.filter((s) => s.completed).length
  const progressPercentage = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "review":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          <div>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full mr-3" style={{ backgroundColor: project.color }}></div>
              <h1 className="text-4xl font-bold text-gray-900">{task.title}</h1>
            </div>
            <p className="text-gray-600 text-lg">{task.description}</p>
          </div>
        </div>
      </div>

      {/* Task Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in">
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={`mt-1 ${getStatusColor(task.status)}`}>{task.status.replace("-", " ")}</Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Priority</p>
                <Badge className={`mt-1 ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(task.dueDate)}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(progressPercentage)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subtask Progress</h3>
            <span className="text-sm text-gray-600">
              {completedSubtasks} of {subtasks.length} subtasks completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        {/* Subtasks */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subtasks</CardTitle>
              <Button onClick={() => setIsAddingSubtask(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Subtask
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Subtask Form */}
              {isAddingSubtask && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-4 space-y-4">
                    <Input
                      placeholder="Subtask title"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="focus-ring"
                    />
                    <Textarea
                      placeholder="Subtask description (optional)"
                      value={newSubtaskDescription}
                      onChange={(e) => setNewSubtaskDescription(e.target.value)}
                      className="focus-ring"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={addSubtask} className="bg-blue-600 hover:bg-blue-700">
                        Add Subtask
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddingSubtask(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subtasks List */}
              {subtasks.length === 0 && !isAddingSubtask ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subtasks Yet</h3>
                  <p className="text-gray-500 mb-4">Click "Add Subtask" to break down your task into smaller steps.</p>
                  <Button onClick={() => setIsAddingSubtask(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add the First Subtask
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subtasks.map((subtask, index) => (
                    <div
                      key={subtask._id}
                      className={`flex items-start space-x-3 p-4 border rounded-lg transition-all duration-200 ${
                        subtask.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                      } hover:shadow-md animate-fade-in`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center mt-1">
                        <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
                        <button
                          onClick={() => toggleSubtask(subtask._id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            subtask.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-green-400"
                          }`}
                        >
                          {subtask.completed && <CheckCircle className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${
                            subtask.completed ? "text-green-800 line-through" : "text-gray-900"
                          }`}
                        >
                          {subtask.title}
                        </h4>
                        {subtask.description && (
                          <p className={`text-sm mt-1 ${subtask.completed ? "text-green-600" : "text-gray-600"}`}>
                            {subtask.description}
                          </p>
                        )}
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          {subtask.assignee && (
                            <>
                              <span>Assigned to {subtask.assignee.name}</span>
                              <span className="mx-2">•</span>
                            </>
                          )}
                          <span>Created {formatDate(subtask.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comments & Attachments */}
        <div className="space-y-6">
          <CommentSection taskId={task._id} user={user} />

          <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Paperclip className="h-5 w-5 mr-2" />
                <CardTitle>Attachments</CardTitle>
              </div>
              <Button
                className="bg-black hover:bg-neutral-800 rounded-full p-2 h-9 w-9 flex items-center justify-center"
                size="icon"
                aria-label="Add Attachment"
                onClick={() => fileManagerRef.current?.triggerUpload()}
              >
                <Upload className="h-5 w-5 text-white" />
              </Button>
            </CardHeader>
            <CardContent>
              <FileManager
                ref={fileManagerRef}
                taskId={task._id}
                category="attachments"
                allowUpload={true}
                minimal={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
