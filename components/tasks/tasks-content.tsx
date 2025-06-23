"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Plus, Search, Calendar, UserIcon, AlertCircle, MessageSquare, Paperclip } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import TaskActionsDropdown from "./task-actions-dropdown"

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
  status: "todo" | "in-progress" | "review" | "completed"
  priority: "low" | "medium" | "high"
  project: {
    _id: string
    title: string
    color: string
  }
  assignee: {
    _id: string
    name: string
    email: string
  }
  dueDate: string
  estimatedHours: number
  tags: string[]
  createdAt: string
  commentCount?: number
  subtaskCount?: { completed: number; total: number }
}

interface TasksContentProps {
  user: User
}

export default function TasksContent({ user }: TasksContentProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("dueDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const router = useRouter()
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  }

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter])

  const loadTasks = async () => {
    try {
      const response = await fetch("/api/tasks")
      const data = await response.json()
      if (response.ok) {
        // Enhanced mock data with additional features
        const enhancedTasks = (data.tasks || []).map((task: any) => ({
          ...task,
          project: {
            _id: task.project,
            title: "Sample Project",
            color: "#3B82F6",
          },
          assignee: {
            _id: task.assignee,
            name: user.name,
            email: user.email,
          },
        }))
        setTasks(enhancedTasks)
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    if (assigneeFilter !== "all") {
      if (assigneeFilter === "me") {
        filtered = filtered.filter((task) => task.assignee._id === user._id)
      }
    }

    setFilteredTasks(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "review":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTasks(tasks.map((task) => (task._id === taskId ? { ...task, status: newStatus as any } : task)))
        toast({
          title: "Task updated",
          description: "Task status has been updated successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      })
    }
  }

  const handleTaskClick = (task: Task) => {
    // Navigate to subtask management page
    router.push(`/dashboard/projects/${task.project._id}/tasks/${task._id}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Tasks ✅
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage and track all your tasks efficiently</p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Link href="/tasks/new">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-slide-in">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 focus-ring"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40 focus-ring">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full lg:w-40 focus-ring">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-full lg:w-40 focus-ring">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="me">My Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
            </h3>
            <p className="text-gray-500 mb-6">
              {tasks.length === 0
                ? "Create your first task to get started"
                : "Try adjusting your search or filter criteria"}
            </p>
            {tasks.length === 0 && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/tasks/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first task
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filteredTasks.map((task, index) => (
            <Card
              key={task._id}
              className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm transition-all duration-200 animate-scale-in cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => handleTaskClick(task)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: task.project.color }}></div>
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      {isOverdue(task.dueDate) && task.status !== "completed" && (
                        <AlertCircle className="h-5 w-5 ml-2 text-red-500" />
                      )}
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>

                    {/* Enhanced Task Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span
                          className={
                            isOverdue(task.dueDate) && task.status !== "completed" ? "text-red-600 font-medium" : ""
                          }
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>{task.assignee.name}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{task.project.title}</span>
                    </div>

                    {/* Task Features */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span>{task.commentCount || 0}</span>
                      </div>
                      {task.subtaskCount && task.subtaskCount.total > 0 && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>
                            {task.subtaskCount.completed}/{task.subtaskCount.total} subtasks
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-6">
                    <div className="flex flex-col gap-2">
                      <Select
                        value={task.status}
                        onValueChange={(value) => {
                          // Prevent event bubbling to card click
                          updateTaskStatus(task._id, value)
                        }}
                        disabled={task.status === "completed" && (task.subtaskCount?.total ?? 0) > 0}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex gap-1">
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <TaskActionsDropdown task={task} onUpdate={loadTasks} />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {task.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
