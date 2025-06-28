"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Users, Target, Clock, Plus, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { formatTimeAgo } from "@/lib/utils/date"
import { autoUpdateProjectStatus, calculateProjectProgress } from "@/lib/utils/project"
import FileManager from "@/components/files/file-manager"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
  lastActive?: string
  lastLogin?: string
  lastLogout?: string
}

interface Project {
  _id: string
  title: string
  description: string
  status: string
  priority: string
  progress: number
  startDate: string
  dueDate: string
  color: string
  tags: string[]
  owner: string
  members: string[]
  createdAt: string
  updatedAt: string
}

interface Task {
  _id: string
  title: string
  status: string
  priority: string
  assignee: string
  dueDate: string
  createdAt: string
}

interface ProjectDetailContentProps {
  user: User
  project: Project
  tasks: Task[]
  users: User[]
}

export default function ProjectDetailContent({
  user,
  project: initialProject,
  tasks: initialTasks,
  users,
}: ProjectDetailContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [project, setProject] = useState(initialProject)
  const [tasks, setTasks] = useState(initialTasks)
  const [activities, setActivities] = useState<any[]>([])
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [project, tasks])

  useEffect(() => {
    // Auto-update project progress based on tasks
    const newProgress = calculateProjectProgress(tasks)
    if (newProgress !== project.progress) {
      updateProjectProgress(newProgress)
    }
  }, [tasks])

  const loadActivities = () => {
    // Generate real-time activities based on project and task data
    const projectActivities = [
      {
        id: `project-created-${project._id}`,
        type: "project_created",
        description: `Project "${project.title}" was created`,
        timestamp: new Date(project.createdAt),
      },
    ]

    const taskActivities = tasks.map((task) => ({
      id: `task-${task._id}`,
      type: task.status === "completed" ? "task_completed" : "task_created",
      description:
        task.status === "completed" ? `Task "${task.title}" was completed` : `Task "${task.title}" was created`,
      timestamp: new Date(task.createdAt),
    }))

    const allActivities = [...projectActivities, ...taskActivities]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)

    setActivities(allActivities)
  }

  const updateProjectProgress = async (newProgress: number) => {
    const newStatus = autoUpdateProjectStatus(newProgress, project.status)

    try {
      const response = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          progress: newProgress,
          status: newStatus,
        }),
      })

      if (response.ok) {
        setProject((prev) => ({ ...prev, progress: newProgress, status: newStatus }))
      }
    } catch (error) {
      console.error("Failed to update project progress:", error)
    }
  }

  const updateProjectStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setProject((prev) => ({ ...prev, status: newStatus }))
        toast({
          title: "Success",
          description: "Project status updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not-started":
        return "bg-gray-100 text-gray-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "on-hold":
        return "bg-red-100 text-red-800"
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && project.status !== "completed"
  }

  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const totalTasks = tasks.length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full mr-3" style={{ backgroundColor: project.color }}></div>
              <h1 className="text-4xl font-bold text-gray-900">{project.title}</h1>
            </div>
            <p className="text-gray-600 text-lg">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div>
            <Select
              value={project.status}
              onValueChange={updateProjectStatus}
              disabled={tasks.length > 0 && project.status === 'completed'}
              open={statusDropdownOpen}
              onOpenChange={setStatusDropdownOpen}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Edit Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed" disabled={tasks.length > 0}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in">
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={`mt-1 ${getStatusColor(project.status)}`}>{project.status.replace("-", " ")}</Badge>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-gray-900">{project.progress}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedTasks}/{totalTasks}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Date</p>
                <p className={`text-sm font-medium ${isOverdue(project.dueDate) ? "text-red-600" : "text-gray-900"}`}>
                  {formatDate(project.dueDate)}
                </p>
                {isOverdue(project.dueDate) && <p className="text-xs text-red-600">Overdue</p>}
              </div>
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                {isOverdue(project.dueDate) && <AlertCircle className="h-4 w-4 ml-1 text-red-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Progress</h3>
            <span className="text-sm text-gray-600">
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <Progress value={project.progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 animate-fade-in">
        <nav className="-mb-px flex space-x-8">
          {["overview", "tasks", "team", "files"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Project Details */}
              <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{project.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Start Date</h4>
                      <p className="text-gray-600">{formatDate(project.startDate)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Due Date</h4>
                      <p className="text-gray-600">{formatDate(project.dueDate)}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href={`/tasks/new?project=${project._id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-2 hover:bg-gray-50">
                    <Link href="/team">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Project Info */}
              <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Project Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Priority</span>
                    <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Team Size</span>
                    <span className="text-sm font-medium">{project.members.length} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">{formatDate(project.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Tasks</CardTitle>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href={`/tasks/new?project=${project._id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-gray-500 mb-4">Create your first task to get started</p>
                  <Button asChild>
                    <Link href={`/tasks/new?project=${project._id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/projects/${project._id}/tasks/${task._id}`)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {formatDate(task.dueDate)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <Badge className={getStatusColor(task.status)}>{task.status.replace("-", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "team" && (
          <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {project.members.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Not assigned to a team</h3>
                  <p className="text-gray-500">You are not assigned to any team for this project.</p>
                </div>
              ) : (
                (() => {
                  const memberUsers = users.filter(
                    (u) => project.members.includes(u._id?.toString() || "") && u._id?.toString() !== user._id
                  )
                  if (memberUsers.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No other members assigned</h3>
                        <p className="text-gray-500">You are the only member assigned to this project.</p>
                      </div>
                    )
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      {memberUsers.map((member) => (
                        <div key={member._id?.toString()} className="rounded-2xl border bg-white/90 shadow-md hover:shadow-xl transition-all duration-200 p-6 flex flex-col gap-2 min-w-[260px]">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow overflow-hidden">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                member.name?.charAt(0).toUpperCase() || "U"
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg text-gray-900">{member.name || member.email}</span>
                              </div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className="bg-blue-100 text-blue-700">Member</Badge>
                            <Badge className="bg-gray-100 text-gray-700">Last Active: {member.lastLogout ? formatTimeAgo(member.lastLogout) : member.lastLogin ? formatTimeAgo(member.lastLogin) : "-"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "files" && (
          <FileManager projectId={project._id} category="attachments" allowUpload={true} />
        )}
      </div>
    </div>
  )
}
