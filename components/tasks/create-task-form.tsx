"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar, Users, CheckCircle, Clock } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
}

interface Project {
  _id: string
  title: string
  color: string
  dueDate?: string
}

interface CreateTaskFormProps {
  user: User
  onSuccess?: () => void
  prefilledData?: {
    dueDate?: Date | null
  }
}

export default function CreateTaskForm({ user, onSuccess, prefilledData }: CreateTaskFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    project: "",
    assignee: "",
    dueDate: prefilledData?.dueDate?.toISOString().split("T")[0] || "",
    estimatedHours: "",
    tags: "",
  })
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([fetch("/api/projects"), fetch("/api/users")])

      const [projectsData, usersData] = await Promise.all([projectsRes.json(), usersRes.json()])

      if (projectsRes.ok) {
        setProjects(projectsData.projects || [])
      }
      if (usersRes.ok) {
        setUsers(usersData.users || [])
      }
    } catch (error) {
      console.error("Failed to load data:", error)
      toast({
        title: "Error",
        description: "Failed to load projects and users",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          estimatedHours: formData.estimatedHours ? Number.parseFloat(formData.estimatedHours) : 0,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Task created!",
          description: "Your new task has been created successfully.",
        })
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/tasks")
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create task",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Find the selected project object
  const selectedProject = projects.find((p) => p._id === formData.project)
  // Today's date in yyyy-mm-dd
  const todayStr = new Date().toISOString().split('T')[0]
  // Project due date in yyyy-mm-dd
  const projectDueDateStr = selectedProject && selectedProject.dueDate ? new Date(selectedProject.dueDate).toISOString().split('T')[0] : undefined
  // Only show users who are members of the selected project
  const projectMembers = selectedProject && selectedProject.members ? users.filter(u => selectedProject.members.includes(u._id)) : []

  if (isLoadingData) {
    return (
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading projects and users...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-semibold text-gray-800">
          <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
          Task Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Task Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={isLoading}
                className="focus-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                Priority
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="focus-ring">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </Label>
            <textarea
              id="description"
              placeholder="Describe what needs to be done"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={isLoading}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-medium text-gray-700">
                Project *
              </Label>
              <Select value={formData.project} onValueChange={(value) => setFormData({ ...formData, project: value })}>
                <SelectTrigger className="focus-ring">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: project.color }}></div>
                        {project.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-sm font-medium text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Assignee *
              </Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => setFormData({ ...formData, assignee: value })}
              >
                <SelectTrigger className="focus-ring">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {projectMembers.length === 0
                    ? <div className="px-4 py-2 text-gray-400 text-sm">No members available</div>
                    : <>
                        <SelectItem value="all">All (Whole Team)</SelectItem>
                        {projectMembers.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Due Date *
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                disabled={isLoading}
                className="focus-ring"
                min={todayStr}
                max={projectDueDateStr}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours" className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Estimated Hours
              </Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                min="0"
                placeholder="0"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                disabled={isLoading}
                className="focus-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              type="text"
              placeholder="bug, feature, urgent"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              disabled={isLoading}
              className="focus-ring"
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating Task..." : "Create Task"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="px-8 border-2 hover:bg-gray-50 transition-all duration-200"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
