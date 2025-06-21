"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  BarChart3,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import TimeAnalytics from "./time-analytics"

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
}

interface Task {
  _id: string
  title: string
  project: string
}

interface TimeEntry {
  _id: string
  projectId: string
  taskId?: string
  description: string
  startTime: string
  endTime?: string
  duration: number // in minutes
  isApproved: boolean
  approvedBy?: string
  createdAt: string
  project: {
    title: string
    color: string
  }
  task?: {
    title: string
  }
}

interface TimeTrackingContentProps {
  user: User
}

export default function TimeTrackingContent({ user }: TimeTrackingContentProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [selectedTask, setSelectedTask] = useState<string>("")
  const [description, setDescription] = useState("")
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [manualHours, setManualHours] = useState("")
  const [manualMinutes, setManualMinutes] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("tracker")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, startTime])

  useEffect(() => {
    if (selectedProject) {
      loadTasksForProject(selectedProject)
    } else {
      setTasks([])
      setSelectedTask("")
    }
  }, [selectedProject])

  const loadData = async () => {
    try {
      // Load projects
      const projectsResponse = await fetch("/api/projects")
      const projectsData = await projectsResponse.json()

      // Load time entries
      const timeEntriesResponse = await fetch("/api/time-entries")
      const timeEntriesData = await timeEntriesResponse.json()

      // Mock data for demonstration
      const mockProjects: Project[] = [
        { _id: "1", title: "Website Redesign", color: "#3B82F6" },
        { _id: "2", title: "Mobile App", color: "#10B981" },
        { _id: "3", title: "Marketing Campaign", color: "#F59E0B" },
      ]

      const mockTimeEntries: TimeEntry[] = [
        {
          _id: "1",
          projectId: "1",
          taskId: "1",
          description: "Working on homepage design",
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          duration: 60,
          isApproved: true,
          createdAt: new Date().toISOString(),
          project: { title: "Website Redesign", color: "#3B82F6" },
          task: { title: "Homepage Design" },
        },
        {
          _id: "2",
          projectId: "2",
          description: "Bug fixes and testing",
          startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          isApproved: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          project: { title: "Mobile App", color: "#10B981" },
        },
      ]

      setProjects(mockProjects)
      setTimeEntries(mockTimeEntries)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast({
        title: "Error",
        description: "Failed to load time tracking data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTasksForProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      const data = await response.json()

      // Mock tasks for demonstration
      const mockTasks: Task[] = [
        { _id: "1", title: "Homepage Design", project: projectId },
        { _id: "2", title: "User Authentication", project: projectId },
        { _id: "3", title: "Database Setup", project: projectId },
      ]

      setTasks(mockTasks)
    } catch (error) {
      console.error("Failed to load tasks:", error)
    }
  }

  const startTracking = () => {
    if (!selectedProject || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a project and add a description",
        variant: "destructive",
      })
      return
    }

    setIsTracking(true)
    setStartTime(new Date())
    setElapsedTime(0)
    toast({
      title: "Time tracking started",
      description: "Timer is now running",
    })
  }

  const pauseTracking = () => {
    setIsTracking(false)
    toast({
      title: "Time tracking paused",
      description: "Timer has been paused",
    })
  }

  const stopTracking = async () => {
    if (!startTime) return

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))

    try {
      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProject,
          taskId: selectedTask || undefined,
          description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration,
        }),
      })

      if (response.ok) {
        const newEntry: TimeEntry = {
          _id: Date.now().toString(),
          projectId: selectedProject,
          taskId: selectedTask || undefined,
          description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration,
          isApproved: false,
          createdAt: new Date().toISOString(),
          project: projects.find((p) => p._id === selectedProject) || { title: "Unknown", color: "#gray" },
          task: tasks.find((t) => t._id === selectedTask),
        }

        setTimeEntries([newEntry, ...timeEntries])
        setIsTracking(false)
        setStartTime(null)
        setElapsedTime(0)
        setDescription("")
        setSelectedTask("")

        toast({
          title: "Time entry saved",
          description: `Logged ${duration} minutes of work`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive",
      })
    }
  }

  const addManualEntry = async () => {
    const hours = Number.parseInt(manualHours) || 0
    const minutes = Number.parseInt(manualMinutes) || 0
    const totalMinutes = hours * 60 + minutes

    if (!selectedProject || !description.trim() || totalMinutes <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const now = new Date()
      const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000)

      const response = await fetch("/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProject,
          taskId: selectedTask || undefined,
          description,
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          duration: totalMinutes,
        }),
      })

      if (response.ok) {
        const newEntry: TimeEntry = {
          _id: Date.now().toString(),
          projectId: selectedProject,
          taskId: selectedTask || undefined,
          description,
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          duration: totalMinutes,
          isApproved: false,
          createdAt: new Date().toISOString(),
          project: projects.find((p) => p._id === selectedProject) || { title: "Unknown", color: "#gray" },
          task: tasks.find((t) => t._id === selectedTask),
        }

        setTimeEntries([newEntry, ...timeEntries])
        setDescription("")
        setSelectedTask("")
        setManualHours("")
        setManualMinutes("")

        toast({
          title: "Manual entry added",
          description: `Added ${totalMinutes} minutes of work`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add manual entry",
        variant: "destructive",
      })
    }
  }

  const deleteTimeEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTimeEntries(timeEntries.filter((entry) => entry._id !== entryId))
        toast({
          title: "Entry deleted",
          description: "Time entry has been deleted",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      })
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Time Tracking ⏱️
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Track your time and manage productivity efficiently</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-2 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 animate-fade-in">
        <nav className="-mb-px flex space-x-8">
          {["tracker", "entries", "analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab === "tracker" && <Clock className="h-4 w-4 mr-2 inline" />}
              {tab === "entries" && <Calendar className="h-4 w-4 mr-2 inline" />}
              {tab === "analytics" && <BarChart3 className="h-4 w-4 mr-2 inline" />}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "tracker" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Timer */}
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Time Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl font-mono font-bold text-gray-900 mb-4">{formatTime(elapsedTime)}</div>
                  <div className="flex justify-center gap-3">
                    {!isTracking ? (
                      <Button onClick={startTracking} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <>
                        <Button onClick={pauseTracking} variant="outline">
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                        <Button onClick={stopTracking} className="bg-red-600 hover:bg-red-700">
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
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

                  <Select value={selectedTask} onValueChange={setSelectedTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task._id} value={task._id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="What are you working on?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Manual Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
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

                  <Select value={selectedTask} onValueChange={setSelectedTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task._id} value={task._id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Description of work done"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={manualHours}
                        onChange={(e) => setManualHours(e.target.value)}
                        min="0"
                        max="24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        min="0"
                        max="59"
                      />
                    </div>
                  </div>

                  <Button onClick={addManualEntry} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "entries" && (
          <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Time Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
                  <p className="text-gray-500 mb-4">Start tracking time or add manual entries to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeEntries.map((entry, index) => (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: entry.project.color }}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{entry.description}</h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span>{entry.project.title}</span>
                            {entry.task && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{entry.task.title}</span>
                              </>
                            )}
                            <span className="mx-2">•</span>
                            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatDuration(entry.duration)}</p>
                          <div className="flex items-center text-sm">
                            {entry.isApproved ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTimeEntry(entry._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "analytics" && <TimeAnalytics user={user} timeEntries={timeEntries} projects={projects} />}
      </div>
    </div>
  )
}
