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
import Modal from '@/components/ui/Modal'
import { LuAlarmClock } from "react-icons/lu"

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
  subtaskId?: string
  subtaskTitle?: string
  description?: string
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
  const [manualBreakMinutes, setManualBreakMinutes] = useState("")
  const [manualPomodoroSummary, setManualPomodoroSummary] = useState<{sessions: number, breaks: number, breaksSkipped: number} | null>(null)
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
  const [trackerSubtasks, setTrackerSubtasks] = useState<{ _id: string; title: string }[]>([])
  const [trackerSubtask, setTrackerSubtask] = useState("")
  const [manualSubtasks, setManualSubtasks] = useState<{ _id: string; title: string }[]>([])
  const [manualSubtask, setManualSubtask] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState(null)
  // Pomodoro state
  const POMODORO_WORK = 25 * 60
  const POMODORO_BREAK = 5 * 60
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work')
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState(0)
  const [breakCount, setBreakCount] = useState(0)
  const [breaksSkipped, setBreaksSkipped] = useState(0)
  const [breakTimeAccum, setBreakTimeAccum] = useState(0)
  const [wasBreakSkipped, setWasBreakSkipped] = useState(false)
  const [allSubtasks, setAllSubtasks] = useState<any[]>([])

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
        setElapsedTime((prev) => {
          if (pomodoroMode === 'work') {
            if (prev + 1 >= POMODORO_WORK) {
              // End of work session
              handlePomodoroSessionEnd()
              return 0
            }
          } else {
            if (prev + 1 >= POMODORO_BREAK) {
              // End of break
              handleBreakEnd()
              return 0
            }
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, startTime, pomodoroMode])

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

  useEffect(() => {
    const loadSubtasks = async () => {
      try {
        const res = await fetch("/api/subtasks")
        const data = await res.json()
        setAllSubtasks(data.subtasks || [])
      } catch (error) {
        toast({ title: "Error", description: "Failed to load subtasks", variant: "destructive" })
      }
    }
    loadSubtasks()
  }, [])

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

  const handlePomodoroSessionEnd = async () => {
    if (!wasBreakSkipped) {
    setPomodoroSessionCount((c) => c + 1)
    }
    setPomodoroMode('break')
    setElapsedTime(0)
    setBreakTimeAccum(0)
    setBreakCount((c) => c + 1)
    // Log the work session
    await logPomodoroSession('work')
  }

  const handleBreakEnd = async () => {
    setPomodoroMode('work')
    setElapsedTime(0)
    setBreakTimeAccum((b) => b + POMODORO_BREAK)
    setWasBreakSkipped(false) // Reset after a break is taken
    // Log the break
    await logPomodoroSession('break')
  }

  const handleSkipBreak = () => {
    setWasBreakSkipped(true)
    setPomodoroMode('work')
    setElapsedTime(0)
    // Optionally log the skipped break if needed
  }

  const logPomodoroSession = async (type: 'work' | 'break') => {
    if (!trackerProject || !trackerTask || !trackerDescription.trim()) return
    const now = new Date()
    const duration = type === 'work' ? POMODORO_WORK / 60 : POMODORO_BREAK / 60
    const body: any = {
      hours: duration / 60,
      date: now.toISOString(),
      description: trackerDescription,
      subtaskId: trackerSubtask || undefined,
      subtaskTitle: trackerSubtasks.find((s) => s._id === trackerSubtask)?.title,
      pomodoroSessions: type === 'work' ? 1 : 0,
      breakMinutes: type === 'break' ? POMODORO_BREAK / 60 : 0,
      breaksSkipped: 0,
    }
    await fetch(`/api/tasks/${trackerTask}/timelog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    fetchAllTimeLogs(allTasks)
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
    setPomodoroMode('work')
    setPomodoroSessionCount(0)
    setBreakCount(0)
    setBreaksSkipped(0)
    setBreakTimeAccum(0)
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
    setIsTracking(false)
    // If stopped during a work session, log partial session if > 0
    if (pomodoroMode === 'work' && elapsedTime > 0) {
      const sessions = Math.floor(elapsedTime / POMODORO_WORK)
      const breaks = breakCount
      const breaksSkipped = Math.max(0, sessions - breaks)
      await fetch(`/api/tasks/${trackerTask}/timelog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: elapsedTime / 3600,
          date: startTime?.toISOString(),
          description: trackerDescription,
          subtaskId: trackerSubtask || undefined,
          subtaskTitle: trackerSubtasks.find((s) => s._id === trackerSubtask)?.title,
          pomodoroSessions: sessions,
          breakMinutes: breakTimeAccum / 60,
          breaksSkipped,
        }),
      })
      fetchAllTimeLogs(allTasks)
    }
        setStartTime(null)
        setElapsedTime(0)
    setTrackerDescription("")
    setTrackerTask("")
    setTrackerSubtask("")
    setPomodoroSessionCount(0)
    setBreakCount(0)
    setBreaksSkipped(0)
    setBreakTimeAccum(0)
    toast({ title: "Time tracking stopped", description: "Session ended" })
  }

  const addManualEntry = async () => {
    const hours = Number.parseInt(manualHours) || 0
    const minutes = Number.parseInt(manualMinutes) || 0
    const totalMinutes = hours * 60 + minutes
    const breakMinutes = Number(manualBreakMinutes) || 0
    if (!manualProject || !manualTask || !manualDescription.trim() || totalMinutes <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (project, task, description, time)",
        variant: "destructive",
      })
      return
    }
    const sessions = Math.floor(totalMinutes / 25)
    const breaks = sessions
    const breaksSkipped = Math.max(0, sessions - Math.floor(breakMinutes / 5))
    const subtask = manualSubtasks.find((s) => s._id === manualSubtask)
    try {
      const now = new Date()
      const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000)
      const response = await fetch(`/api/tasks/${manualTask}/timelog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: totalMinutes / 60,
          date: startTime.toISOString(),
          description: manualDescription,
          subtaskId: manualSubtask || undefined,
          subtaskTitle: subtask ? subtask.title : undefined,
          pomodoroSessions: sessions,
          breakMinutes,
          breaksSkipped,
        }),
      })
      if (response.ok) {
        setManualDescription("")
        setManualTask("")
        setManualProject("")
        setManualHours("")
        setManualMinutes("")
        setManualSubtask("")
        setManualBreakMinutes("")
        setManualPomodoroSummary(null)
        toast({ title: "Manual entry added", description: `Added ${totalMinutes} minutes of work` })
        fetchAllTimeLogs(allTasks)
      } else {
        toast({ title: "Error", description: "Failed to add manual entry", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add manual entry", variant: "destructive" })
    }
  }

  const openDeleteModal = (entry: any) => {
    setEntryToDelete(entry)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setEntryToDelete(null)
  }

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return
    try {
      const response = await fetch(`/api/tasks/${(entryToDelete as any).taskId}/timelog`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: (entryToDelete as any)._id }),
      })
      if (response.ok) {
        setTimeEntries(timeEntries.filter((entry) => (entry as any)._id !== (entryToDelete as any)._id))
        toast({
          title: "Entry deleted",
          description: "Time entry has been deleted",
        })
        fetchAllTimeLogs(allTasks)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      })
    } finally {
      closeDeleteModal()
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
      const sortedTimeLogs = [...allLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setTimeLogs(sortedTimeLogs)
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

  // Add a helper to format the timestamp
  function formatTimestamp(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-report');
    if (!element) return;
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('time-tracking-report.pdf');
  };

  console.log("tasks", tasks);
  console.log("projects", projects);
  console.log("timeLogs", timeLogs);

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
      <div className="flex items-center justify-between animate-fade-in mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-4">
            <LuAlarmClock className="text-purple-600" size={48} />
            Time Tracking
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Track your time and manage productivity efficiently</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleDownloadPDF} className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      <div id="pdf-content">
        {/* Tabs */}
        <div className="border-b border-gray-200 animate-fade-in mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              "tracker",
              "entries",
              "analytics"
            ].map((tab) => (
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
                      {pomodoroMode === 'break' && isTracking && (
                        <Button onClick={handleSkipBreak} className="bg-yellow-600 hover:bg-yellow-700 ml-2">
                          Skip Break
                        </Button>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Break Minutes</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={manualBreakMinutes}
                        onChange={e => {
                          setManualBreakMinutes(e.target.value)
                          // Calculate summary
                          const workMinutes = (Number(manualHours) || 0) * 60 + (Number(manualMinutes) || 0)
                          const breakMinutes = Number(e.target.value) || 0
                          const sessions = Math.floor(workMinutes / 25)
                          const breaks = sessions
                          const breaksSkipped = Math.max(0, sessions - Math.floor(breakMinutes / 5))
                          setManualPomodoroSummary({ sessions, breaks, breaksSkipped })
                        }}
                        min="0"
                        max="300"
                      />
                    </div>
                    {manualPomodoroSummary && (
                      <div className="text-xs text-gray-600 mt-1">
                        Pomodoro Sessions: <b>{manualPomodoroSummary.sessions}</b>, Breaks: <b>{manualPomodoroSummary.breaks}</b>, Breaks Skipped: <b>{manualPomodoroSummary.breaksSkipped}</b>
                      </div>
                    )}

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
                    {timeLogs.map((log, index) => {
                      const task = allTasks.find(t => String(t._id) === String(log.taskId));
                      const project = projects.find(p => String(p._id) === String(task?.project));
                      const subtask = log.subtaskId ? allSubtasks.find(s => String(s._id) === String(log.subtaskId)) : null;
                      console.log('log', log, 'task', task, 'project', project);
                      return (
                        <div
                          key={log._id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: project?.color || "#ccc" }}
                            ></div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {subtask ? subtask.title : (task?.title || 'Unknown Task')}
                              </h4>
                              <div className="flex items-center text-sm text-gray-500 mt-1 gap-1 flex-wrap">
                                {subtask ? (
                                  <>
                                    <span>{project?.title || 'Unknown Project'}</span>
                                    <span className="mx-1">•</span>
                                    <span>{task?.title || 'Unknown Task'}</span>
                                    <span className="mx-1">•</span>
                                    <span>{formatTimestamp(log.date)}</span>
                                  </>
                                ) : (
                                  <>
                                    <span>{project?.title || 'Unknown Project'}</span>
                                    <span className="mx-1">•</span>
                                    <span>{formatTimestamp(log.date)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700 font-semibold">{log.hours.toFixed(1)}h</span>
                            <button
                              onClick={() => openDeleteModal(log)}
                              className="ml-2 text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                              title="Delete entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
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
                projectId: String(allTasks.find(t => String(t._id) === String(log.taskId))?.project || ''),
                description: log.description || '',
                duration: log.hours * 60, // convert hours to minutes
                createdAt: log.date,
                project: projects.find((p) => String(p._id) === String(allTasks.find(t => String(t._id) === String(log.taskId))?.project)) || { title: 'Unknown', color: '#ccc' },
              }))}
              projects={projects}
            />
          )}
        </div>
      </div>
      <Modal open={deleteModalOpen}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Delete Entry</h3>
          <p className="mb-6">Are you sure you want to delete this entry? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteEntry}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
      {/* Hidden PDF Report Section */}
      <div id="pdf-report" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <h2 className="text-2xl font-bold mb-4">Time Entries</h2>
        {/* Entries Table */}
        {timeLogs.length === 0 ? (
          <div className="text-center py-12">
            <p>No time entries yet</p>
          </div>
        ) : (
          <table className="min-w-full text-xs border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Project</th>
                <th className="p-2 border">Task</th>
                <th className="p-2 border">Subtask</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Hours</th>
                <th className="p-2 border">Description</th>
              </tr>
            </thead>
            <tbody>
              {timeLogs.map((log) => {
                const task = allTasks.find(t => String(t._id) === String(log.taskId));
                const project = projects.find(p => String(p._id) === String(task?.project));
                const subtask = log.subtaskId ? allSubtasks.find(s => String(s._id) === String(log.subtaskId)) : null;
                return (
                  <tr key={log._id}>
                    <td className="border p-2">{project?.title || 'Unknown Project'}</td>
                    <td className="border p-2">{task?.title || 'Unknown Task'}</td>
                    <td className="border p-2">{subtask?.title || '-'}</td>
                    <td className="border p-2">{formatTimestamp(log.date)}</td>
                    <td className="border p-2">{log.hours.toFixed(1)}</td>
                    <td className="border p-2">{log.description || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <h2 className="text-2xl font-bold mt-8 mb-4">Analytics</h2>
        <div style={{ width: 900 }}>
          <TimeAnalytics
            user={user}
            timeEntries={timeLogs.map((log) => ({
              _id: log._id,
              projectId: String(allTasks.find(t => String(t._id) === String(log.taskId))?.project || ''),
              description: log.description || '',
              duration: log.hours * 60, // convert hours to minutes
              createdAt: log.date,
              project: projects.find((p) => String(p._id) === String(allTasks.find(t => String(t._id) === String(log.taskId))?.project)) || { title: 'Unknown', color: '#ccc' },
            }))}
            projects={projects}
          />
        </div>
      </div>
    </div>
  )
}

