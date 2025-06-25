"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Clock,
  Target,
  TrendingUp,
  Download,
  RefreshCw,
  Timer,
  Zap,
  CheckCircle,
  Activity,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import ActivityFeed from '@/components/dashboard/activity-feed'

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
}

interface ReportsContentProps {
  user: User
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function ReportsContent({ user }: ReportsContentProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [pomodoroSessions, setPomodoroSessions] = useState<any[]>([])
  const [realTimeData, setRealTimeData] = useState({
    totalHours: 0,
    pomodoroSessions: 0,
    efficiencyRate: 0,
    tasksCompleted: 0,
    timeTrackingData: [],
    pomodoroData: [],
    projectTimeData: [],
    productivityTrends: [],
    taskCompletionData: [],
    donutChartData: [],
    avgSessionLength: 0,
    breakSkipped: 0,
    focusBreakRatio: 0,
    focusSessionsByDay: [],
  })

  useEffect(() => {
    loadRealTimeData()
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadRealTimeData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadRealTimeData = async () => {
    try {
      // Fetch all user time logs for real analytics
      const [projectsRes, tasksRes, pomodoroRes, timeLogsRes] = await Promise.all([
        fetch("/api/projects", { cache: 'no-store' }),
        fetch("/api/tasks", { cache: 'no-store' }),
        fetch(`/api/pomodoro-sessions?userId=${user._id}`, { cache: 'no-store' }),
        fetch("/api/timelogs", { cache: 'no-store' }),
      ])

      const projectsData = await projectsRes.json()
      const tasksData = await tasksRes.json()
      const pomodoroData = pomodoroRes.ok ? await pomodoroRes.json() : []
      const timeLogs = timeLogsRes.ok ? (await timeLogsRes.json()).timeLogs : []
      setPomodoroSessions(pomodoroData)

      // Calculate real metrics from actual data
      const projects = projectsData.projects || []
      const tasks = tasksData.tasks || []

      // --- REAL DATA AGGREGATION ---
      // Total Hours
      const totalHours = timeLogs.reduce((sum, log) => sum + (log.hours || 0), 0)
      // Focus Sessions (Pomodoro)
      const focusSessions = timeLogs.reduce((sum, log) => sum + (log.pomodoroSessions || 0), 0)
      // Tasks Done
      const completedTasks = tasks.filter((task) => task.status === "completed")

      // Weekly Time Tracking Chart (group by day)
      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const timeTrackingData = weekDays.map((day, i) => {
        const logsForDay = timeLogs.filter(log => new Date(log.date).getDay() === i)
        return {
          day,
          hours: logsForDay.reduce((sum, log) => sum + (log.hours || 0), 0),
          target: 8,
        }
      })

      // Weekly Focus Sessions Chart (group by day)
      const focusSessionsByDay = weekDays.map((day, i) => {
        const logsForDay = timeLogs.filter(log => new Date(log.date).getDay() === i)
        return {
          day,
          sessions: logsForDay.reduce((sum, log) => sum + (log.pomodoroSessions || 0), 0),
        }
      })

      // Pomodoro by hour (line chart)
      const hours = Array.from({ length: 24 }, (_, i) => i)
      const pomodoroDataByHour = hours.map((hour) => ({
        hour: `${hour}:00`,
        pomodoros: timeLogs.filter(log => {
          const d = new Date(log.date)
          return d.getHours() === hour
        }).reduce((sum, log) => sum + (log.pomodoroSessions || 0), 0),
      }))

      // Donut chart: Focus vs Break time (minutes)
      const focusMinutes = timeLogs.reduce((sum, log) => sum + ((log.pomodoroSessions || 0) * 25), 0)
      const breakMinutes = timeLogs.reduce((sum, log) => sum + (log.breakMinutes || 0), 0)
      const donutChartData = [
        { name: 'Focus', value: Math.round(focusMinutes), color: '#3B82F6' },
        { name: 'Break', value: Math.round(breakMinutes), color: '#F59E0B' },
      ]

      // Project Time Distribution (aggregate from timeLogs)
      const projectTimeMap = new Map()
      timeLogs.forEach(log => {
        const projectId = tasks.find(t => t._id === log.taskId)?.project
        if (!projectId) return
        if (!projectTimeMap.has(projectId)) {
          const project = projects.find(p => p._id === projectId)
          projectTimeMap.set(projectId, {
            name: project ? project.title : 'Unknown',
            hours: 0,
            color: project ? project.color : '#ccc',
          })
        }
        projectTimeMap.get(projectId).hours += log.hours || 0
      })
      const projectTimeData = Array.from(projectTimeMap.values())

      // --- PRODUCTIVITY TRENDS (REAL DATA) ---
      // Helper to get week number from a date
      function getWeekNumber(d: Date) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        return weekNo;
      }
      // Get last 6 weeks
      const now = new Date();
      const currentWeek = getWeekNumber(now);
      const currentYear = now.getFullYear();
      const weeks = Array.from({length: 6}, (_, i) => {
        const weekNum = currentWeek - (5 - i);
        return { week: `Week ${weekNum}`, weekNum, year: currentYear };
      });
      // Aggregate for each week
      const productivityTrends = weeks.map(({ week, weekNum, year }) => {
        // Filter logs and tasks for this week
        const logsForWeek = timeLogs.filter(log => {
          const d = new Date(log.date);
          return getWeekNumber(d) === weekNum && d.getFullYear() === year;
        });
        const tasksForWeek = tasks.filter(task => {
          const d = new Date(task.createdAt || task.date || task.completedAt || task.updatedAt || now);
          return getWeekNumber(d) === weekNum && d.getFullYear() === year;
        });
        const completedTasksForWeek = tasksForWeek.filter(t => t.status === "completed");
        // Efficiency: completed/total tasks
        const efficiency = Math.round((completedTasksForWeek.length / Math.max(tasksForWeek.length, 1)) * 100);
        // Focus: total pomodoro sessions (or minutes)
        const totalFocusSessions = logsForWeek.reduce((sum, log) => sum + (log.pomodoroSessions || 0), 0);
        const totalHours = logsForWeek.reduce((sum, log) => sum + (log.hours || 0), 0);
        const focus = Math.round((totalFocusSessions * 25) / Math.max(totalHours * 60, 1) * 100); // as % of time
        // Completion: same as efficiency for now
        const completion = efficiency;
        return {
          week,
          efficiency,
          focus,
          completion,
        };
      });

      setRealTimeData({
        totalHours: Math.round(totalHours * 10) / 10,
        pomodoroSessions: focusSessions,
        efficiencyRate: Math.min(
          95,
          Math.max(75, Math.round((completedTasks.length / Math.max(tasks.length, 1)) * 100)),
        ),
        tasksCompleted: completedTasks.length,
        timeTrackingData,
        pomodoroData: pomodoroDataByHour,
        projectTimeData,
        productivityTrends,
        taskCompletionData: [],
        donutChartData,
        avgSessionLength: 25,
        breakSkipped: 0,
        focusBreakRatio: 100,
        focusSessionsByDay,
      })
    } catch (error) {
      console.error("Failed to load real-time data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateWeeklyData = (tasks: any[]) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return days.map((day, index) => ({
      day,
      hours: Math.round((Math.random() * 4 + 6) * 10) / 10,
      target: index < 5 ? 8 : index === 5 ? 6 : 4,
    }))
  }

  const generatePomodoroData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return days.map((day) => {
      const sessions = Math.floor(Math.random() * 8 + 8)
      return {
        day,
        sessions,
        completed: Math.floor(sessions * (0.8 + Math.random() * 0.2)),
      }
    })
  }

  const generateProjectTimeData = (projects: any[], tasks: any[]) => {
    return projects.slice(0, 5).map((project: any, index: number) => ({
      name: project.title,
      hours: Math.round((Math.random() * 30 + 15) * 10) / 10,
      color: COLORS[index % COLORS.length],
    }))
  }

  const generateProductivityTrends = () => {
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"]
    let efficiency = 78
    let focus = 82
    let completion = 85

    return weeks.map((week) => {
      efficiency += Math.random() * 8 - 2
      focus += Math.random() * 6 - 1
      completion += Math.random() * 6 - 1

      efficiency = Math.max(70, Math.min(95, efficiency))
      focus = Math.max(75, Math.min(95, focus))
      completion = Math.max(80, Math.min(98, completion))

      return {
        week,
        efficiency: Math.round(efficiency),
        focus: Math.round(focus),
        completion: Math.round(completion),
      }
    })
  }

  const generateTaskCompletionData = (tasks: any[]) => {
    return Array.from({ length: 6 }, (_, i) => {
      const hours = (i + 1) * 2
      const tasksCount = Math.floor(hours * 1.8 + Math.random() * 3)
      return {
        hours,
        tasks: tasksCount,
        efficiency: Math.round((tasksCount / hours) * 10) / 10,
      }
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Live Analytics 📊
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Real-time productivity insights and performance metrics</p>
          <div className="flex items-center mt-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live data • Updates every 30 seconds
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-2 hover:bg-gray-50 transition-all duration-200">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Live Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in">
        <Card className="hover-lift bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Hours</CardTitle>
            <Clock className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{realTimeData.totalHours}h</div>
            <p className="text-xs opacity-80 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Focus Sessions</CardTitle>
            <Timer className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{realTimeData.pomodoroSessions}</div>
            <p className="text-xs opacity-80 mt-1">Completed this week</p>
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Efficiency Rate</CardTitle>
            <Zap className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{realTimeData.efficiencyRate}%</div>
            <p className="text-xs opacity-80 mt-1">
              {realTimeData.efficiencyRate > 85
                ? "↗ Excellent"
                : realTimeData.efficiencyRate > 75
                  ? "→ Good"
                  : "↘ Needs improvement"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Tasks Done</CardTitle>
            <CheckCircle className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{realTimeData.tasksCompleted}</div>
            <p className="text-xs opacity-80 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Time Tracking Overview */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Live Time Tracking
            </CardTitle>
            <div className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={realTimeData.timeTrackingData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#3B82F6"
                fill="url(#colorHours)"
                strokeWidth={3}
                name="Hours Worked"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Target Hours"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Live Focus Sessions */}
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                <Timer className="h-5 w-5 mr-2 text-green-600" />
                Focus Sessions
              </CardTitle>
              <div className="flex items-center text-sm text-green-600">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={realTimeData.focusSessionsByDay || []}>
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)" }} />
                <Legend />
                <Bar dataKey="sessions" fill="#10B981" name="Total Sessions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Live Project Distribution */}
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Project Time Distribution
              </CardTitle>
              <div className="flex items-center text-sm text-green-600">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={realTimeData.projectTimeData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {(realTimeData.projectTimeData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pomodoro Donut Chart and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Pomodoro Donut Chart */}
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              Pomodoro Focus vs Break
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={realTimeData.donutChartData || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(realTimeData.donutChartData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 mt-2">Focus vs Break Time (Pomodoro)</div>
          </CardContent>
        </Card>
        {/* Team Activity Feed */}
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              Team Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed user={user} pomodoroSessions={pomodoroSessions} />
          </CardContent>
        </Card>
      </div>

      {/* Live Productivity Trends */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
              Live Productivity Trends
            </CardTitle>
            <div className="flex items-center text-sm text-green-600">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Real-time tracking
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={realTimeData.productivityTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Efficiency %"
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="focus"
                stroke="#10B981"
                strokeWidth={3}
                name="Focus %"
                dot={{ fill: "#10B981", strokeWidth: 2, r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="completion"
                stroke="#F59E0B"
                strokeWidth={3}
                name="Completion %"
                dot={{ fill: "#F59E0B", strokeWidth: 2, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Live Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Peak Performance</p>
                <p className="text-2xl font-bold text-green-800">
                  {realTimeData.timeTrackingData.length > 0
                    ? realTimeData.timeTrackingData.reduce((max: any, day: any) => (day.hours > max.hours ? day : max))
                        .day
                    : "Wednesday"}
                </p>
                <p className="text-xs text-green-600">Most productive day</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Average Focus</p>
                <p className="text-2xl font-bold text-blue-800">
                  {Math.round((realTimeData.totalHours / Math.max(realTimeData.pomodoroSessions, 1)) * 10) / 10}h
                </p>
                <p className="text-xs text-blue-600">Per session</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Top Project</p>
                <p className="text-2xl font-bold text-purple-800">
                  {realTimeData.projectTimeData.length > 0
                    ? realTimeData.projectTimeData[0].name.split(" ")[0]
                    : "TrackFlow"}
                </p>
                <p className="text-xs text-purple-600">Most time invested</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
