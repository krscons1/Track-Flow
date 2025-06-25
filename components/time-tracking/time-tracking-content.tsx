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

interface TimeLog {
  _id: string
  taskId: string
  userId: string
  hours: number
  date: string
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
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  // Tracker state
  const [trackerProject, setTrackerProject] = useState("")
  const [trackerTask, setTrackerTask] = useState("")
  const [trackerDescription, setTrackerDescription] = useState("")
  // Manual entry state
  const [manualProject, setManualProject] = useState("")
  const [manualTask, setManualTask] = useState("")
  const [manualDescription, setManualDescription] = useState("")
  const [manualTasks, setManualTasks] = useState<Task[]>([])
  const [trackerSubtasks, setTrackerSubtasks] = useState([])
  const [trackerSubtask, setTrackerSubtask] = useState("")
  const [manualSubtasks, setManualSubtasks] = useState([])
  const [manualSubtask, setManualSubtask] = useState("")

  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [])

  useEffect(() => {
    if (trackerProject) {
      setTasks(allTasks.filter((task) => task.project === trackerProject))
      setTrackerTask("")
    } else {
      setTasks([])
      setTrackerTask("")
    }
  }, [trackerProject, allTasks])

  useEffect(() => {
    if (manualProject) {
      setManualTasks(allTasks.filter((task) => task.project === manualProject))
      setManualTask("")
    } else {
      setManualTasks([])
      setManualTask("")
    }
  }, [manualProject, allTasks])

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
    if (trackerTask) {
      fetch(`/api/tasks/${trackerTask}/subtasks`).then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setTrackerSubtasks(data.subtasks || [])
          setTrackerSubtask("")
        }
      })
    } else {
      setTrackerSubtasks([])
      setTrackerSubtask("")
    }
  }, [trackerTask])

  useEffect(() => {
    if (manualTask) {
      fetch(`/api/tasks/${manualTask}/subtasks`).then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setManualSubtasks(data.subtasks || [])
          setManualSubtask("")
        }
      })
    } else {
      setManualSubtasks([])
      setManualSubtask("")
    }
  }, [manualTask])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/projects")
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const res = await fetch("/api/tasks")
      const data = await res.json()
      setAllTasks(data.tasks || [])
    } catch (error) {
      toast({ title: "Error", description: "Failed to load tasks", variant: "destructive" })
    }
  }

  const startTracking = () => {
    if (!trackerProject || !trackerTask || !trackerDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a project, task, and add a description",
        variant: "destructive",
      })
      return
    }
    setIsTracking(true)
    setStartTime(new Date())
    setElapsedTime(0)
    toast({ title: "Time tracking started", description: "Timer is now running" })
  }

  const pauseTracking = () => {
    setIsTracking(false)
    toast({
      title: "Time tracking paused",
      description: "Timer has been paused",
    })
  }

  const stopTracking = async () => {
    if (!startTime || !trackerTask) return
    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    const hours = duration / 60
    try {
      const response = await fetch(`/api/tasks/${trackerTask}/timelog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours, date: startTime.toISOString(), description: trackerDescription }),
      })
      if (response.ok) {
        setIsTracking(false)
        setStartTime(null)
        setElapsedTime(0)
        setTrackerDescription("")
        setTrackerTask("")
        toast({ title: "Time entry saved", description: `Logged ${duration} minutes of work` })
        fetchAllTimeLogs(allTasks)
      } else {
        toast({ title: "Error", description: "Failed to save time entry", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save time entry", variant: "destructive" })
    }
  }

  const addManualEntry = async () => {
    const hours = Number.parseInt(manualHours) || 0
    const minutes = Number.parseInt(manualMinutes) || 0
    const totalMinutes = hours * 60 + minutes
    if (!manualProject || !manualTask || !manualDescription.trim() || totalMinutes <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (project, task, description, time)",
        variant: "destructive",
      })
      return
    }
    try {
      const now = new Date()
      const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000)
      const response = await fetch(`/api/tasks/${manualTask}/timelog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: totalMinutes / 60, date: startTime.toISOString(), description: manualDescription }),
      })
      if (response.ok) {
        setManualDescription("")
        setManualTask("")
        setManualProject("")
        setManualHours("")
        setManualMinutes("")
        toast({ title: "Manual entry added", description: `Added ${totalMinutes} minutes of work` })
        fetchAllTimeLogs(allTasks)
      } else {
        toast({ title: "Error", description: "Failed to add manual entry", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add manual entry", variant: "destructive" })
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

  // Fetch all time logs for the current user
  const fetchAllTimeLogs = async (tasks: Task[]) => {
    try {
      const allLogs: TimeLog[] = []
      for (const task of tasks) {
        const res = await fetch(`/api/tasks/${task._id}/timelog`)
        if (res.ok) {
          const data = await res.json()
          if (data.timeLogs) {
            allLogs.push(...data.timeLogs.map((log: any) => ({ ...log, taskTitle: task.title, project: task.project })))
          }
        }
      }
      setTimeLogs(allLogs)
    } catch (error) {
      toast({ title: "Error", description: "Failed to load time logs", variant: "destructive" })
    }
  }

  // Fetch logs when tasks change
  useEffect(() => {
    if (allTasks.length > 0) {
      fetchAllTimeLogs(allTasks)
    }
  }, [allTasks])

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
                  <Select value={trackerProject} onValueChange={setTrackerProject}>
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

                  <Select value={trackerTask} onValueChange={setTrackerTask}>
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

                  {trackerSubtasks.length > 0 && (
                    <Select value={trackerSubtask} onValueChange={setTrackerSubtask}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subtask (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {trackerSubtasks.map((subtask) => (
                          <SelectItem key={subtask._id} value={subtask._id}>
                            {subtask.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Textarea
                    placeholder="What are you working on?"
                    value={trackerDescription}
                    onChange={(e) => setTrackerDescription(e.target.value)}
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
                  <Select value={manualProject} onValueChange={setManualProject}>
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

                  <Select value={manualTask} onValueChange={setManualTask}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {manualTasks.map((task) => (
                        <SelectItem key={task._id} value={task._id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {manualSubtasks.length > 0 && (
                    <Select value={manualSubtask} onValueChange={setManualSubtask}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subtask (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {manualSubtasks.map((subtask) => (
                          <SelectItem key={subtask._id} value={subtask._id}>
                            {subtask.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Textarea
                    placeholder="Description of work done"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
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
              {timeLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
                  <p className="text-gray-500 mb-4">Start tracking time or add manual entries to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeLogs.map((log, index) => (
                    <div
                      key={log._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: (projects.find(p => p._id === log.project)?.color || '#ccc') }}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{log.taskTitle}</h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span>{projects.find(p => p._id === log.project)?.title || 'Unknown Project'}</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(log.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{(log.hours * 60).toFixed(0)}m</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "analytics" && (
          <TimeAnalytics
            user={user}
            timeEntries={timeLogs.map((log) => ({
              _id: log._id,
              projectId: log.project,
              description: log.taskTitle || '',
              duration: log.hours * 60, // convert hours to minutes
              createdAt: log.date,
              project: projects.find((p) => p._id === log.project) || { title: 'Unknown', color: '#ccc' },
            }))}
            projects={projects}
          />
        )}
      </div>
    </div>
  )
}
