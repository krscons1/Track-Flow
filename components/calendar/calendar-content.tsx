"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, AlertTriangle, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import CreateTaskForm from "@/components/tasks/create-task-form"
import CreateProjectForm from "@/components/projects/create-project-form"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: "task" | "project" | "deadline"
  priority: "low" | "medium" | "high"
  color: string
  isOverdue?: boolean
  project?: string
}

interface CalendarContentProps {
  user: User
}

export default function CalendarContent({ user }: CalendarContentProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<"options" | "task" | "project">("options")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRealUserData()
  }, [])

  const loadRealUserData = async () => {
    try {
      // Fetch real user tasks and projects
      const [tasksRes, projectsRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/projects")])

      const tasksData = await tasksRes.json()
      const projectsData = await projectsRes.json()

      const tasks = tasksData.tasks || []
      const projects = projectsData.projects || []

      // Convert tasks and projects to calendar events
      const taskEvents: CalendarEvent[] = tasks
        .filter((task: any) => task.dueDate)
        .map((task: any) => ({
          id: `task-${task._id}`,
          title: task.title,
          date: new Date(task.dueDate),
          type: "task" as const,
          priority: task.priority,
          color: getPriorityColor(task.priority),
          isOverdue: new Date(task.dueDate) < new Date() && task.status !== "completed",
          project: task.project?.title || "Unknown Project",
        }))

      const projectEvents: CalendarEvent[] = projects
        .filter((project: any) => project.dueDate)
        .map((project: any) => ({
          id: `project-${project._id}`,
          title: `${project.title} Deadline`,
          date: new Date(project.dueDate),
          type: "deadline" as const,
          priority: "high" as const,
          color: "#EF4444",
          isOverdue: new Date(project.dueDate) < new Date() && project.status !== "completed",
        }))

      setEvents([...taskEvents, ...projectEvents])
    } catch (error) {
      console.error("Failed to load calendar data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#EF4444"
      case "medium":
        return "#F59E0B"
      case "low":
        return "#10B981"
      default:
        return "#6B7280"
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => event.date.toDateString() === date.toDateString())
  }

  const getTodaysEvents = () => {
    return getEventsForDate(new Date())
  }

  const getUpcomingDeadlines = () => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return events
      .filter((event) => event.date >= now && event.date <= nextWeek)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
  }

  const getOverdueItems = () => {
    return events.filter((event) => event.isOverdue).slice(0, 3)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsModalOpen(true)
    setModalContent("options")
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = getEventsForDate(date)
      const isToday = date.toDateString() === new Date().toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()
      const hasOverdue = dayEvents.some((event) => event.isOverdue)

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-100 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
            isToday ? "bg-blue-50 border-blue-200" : ""
          } ${isSelected ? "bg-purple-50 border-purple-200" : ""} ${hasOverdue ? "bg-red-50 border-red-200" : ""}`}
          onClick={() => handleDateClick(date)}
        >
          <div
            className={`text-sm font-medium mb-1 flex items-center justify-between ${
              isToday ? "text-blue-600" : hasOverdue ? "text-red-600" : "text-gray-900"
            }`}
          >
            <span>{day}</span>
            {hasOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate ${
                  event.isOverdue ? "bg-red-100 text-red-800 font-medium" : ""
                }`}
                style={{
                  backgroundColor: event.isOverdue ? undefined : event.color + "20",
                  color: event.isOverdue ? undefined : event.color,
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>}
          </div>
        </div>,
      )
    }

    return days
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 h-96 bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Calendar 📅
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Track your deadlines and important dates</p>
            {getOverdueItems().length > 0 && (
              <div className="flex items-center mt-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                {getOverdueItems().length} overdue item{getOverdueItems().length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-slide-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-2xl font-semibold text-gray-800">
                    <Calendar className="h-6 w-6 mr-3 text-purple-600" />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth("prev")}
                      className="border-2 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                      className="border-2 hover:bg-gray-50"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth("next")}
                      className="border-2 hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-0 mb-4">
                  {dayNames.map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                  {renderCalendarDays()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overdue Items */}
            {getOverdueItems().length > 0 && (
              <Card className="hover-lift shadow-lg border-0 bg-red-50 border-red-200 animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold text-red-800">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Overdue Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getOverdueItems().map((event) => (
                      <div key={event.id} className="p-3 rounded-lg bg-white border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm text-red-900">{event.title}</h4>
                          <Badge className="text-xs bg-red-100 text-red-800">{event.type}</Badge>
                        </div>
                        <p className="text-xs text-red-600">Due {formatDistanceToNow(event.date)} ago</p>
                        {event.project && <p className="text-xs text-gray-500 mt-1">{event.project}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Events */}
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Today's Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getTodaysEvents().length === 0 ? (
                  <p className="text-gray-500 text-sm">No events today</p>
                ) : (
                  <div className="space-y-3">
                    {getTodaysEvents().map((event) => (
                      <div key={event.id} className="p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge className="text-xs" style={{ backgroundColor: event.color + "20", color: event.color }}>
                            {event.type}
                          </Badge>
                        </div>
                        {event.project && <p className="text-xs text-gray-500">{event.project}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
                  <Users className="h-5 w-5 mr-2 text-orange-600" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getUpcomingDeadlines().length === 0 ? (
                    <p className="text-gray-500 text-sm">No upcoming deadlines</p>
                  ) : (
                    getUpcomingDeadlines().map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-gray-500">{formatDistanceToNow(event.date, { addSuffix: true })}</p>
                          {event.project && <p className="text-xs text-gray-400">{event.project}</p>}
                        </div>
                        <Badge
                          className={`text-xs ${
                            event.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : event.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {event.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Legend */}
            <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">High Priority / Overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-600">Medium Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Low Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Today</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new task or project for {selectedDate?.toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {modalContent === "options" && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button variant="outline" onClick={() => setModalContent("task")}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
              <Button variant="outline" onClick={() => setModalContent("project")}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          )}
          {modalContent === "task" && (
            <CreateTaskForm
              user={user}
              onSuccess={() => {
                setIsModalOpen(false)
                loadRealUserData()
              }}
              prefilledData={{ dueDate: selectedDate }}
            />
          )}
          {modalContent === "project" && (
            <CreateProjectForm
              user={user}
              onSuccess={() => {
                setIsModalOpen(false)
                loadRealUserData()
              }}
              prefilledData={{ dueDate: selectedDate, startDate: selectedDate }}
            />
          )}
          <DialogFooter>
            {modalContent !== "options" && (
              <Button variant="ghost" onClick={() => setModalContent("options")}>
                Back
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
