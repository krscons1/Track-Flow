"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Clock, TrendingUp, Target, Calendar } from "lucide-react"

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

interface TimeEntry {
  _id: string
  projectId: string
  description: string
  duration: number
  createdAt: string
  project: {
    title: string
    color: string
  }
}

interface TimeAnalyticsProps {
  user: User
  timeEntries: TimeEntry[]
  projects: Project[]
}

export default function TimeAnalytics({ user, timeEntries, projects }: TimeAnalyticsProps) {
  // Calculate analytics data
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0) / 60
  const averageHoursPerDay = totalHours / 7 // Assuming last 7 days
  const totalEntries = timeEntries.length

  // Project breakdown
  const projectData = projects
    .map((project) => {
      const projectEntries = timeEntries.filter((entry) => entry.projectId === project._id)
      const totalMinutes = projectEntries.reduce((sum, entry) => sum + entry.duration, 0)
      return {
        name: project.title,
        hours: Math.round((totalMinutes / 60) * 10) / 10,
        color: project.color,
      }
    })
    .filter((item) => item.hours > 0)

  // Daily breakdown (last 7 days)
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayEntries = timeEntries.filter((entry) => {
      const entryDate = new Date(entry.createdAt)
      return entryDate.toDateString() === date.toDateString()
    })
    const totalMinutes = dayEntries.reduce((sum, entry) => sum + entry.duration, 0)
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      hours: Math.round((totalMinutes / 60) * 10) / 10,
    }
  })

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Hours</p>
                <p className="text-3xl font-bold">{Math.round(totalHours * 10) / 10}h</p>
              </div>
              <Clock className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Daily Average</p>
                <p className="text-3xl font-bold">{Math.round(averageHoursPerDay * 10) / 10}h</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Entries</p>
                <p className="text-3xl font-bold">{totalEntries}</p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift shadow-lg border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">This Week</p>
                <p className="text-3xl font-bold">{Math.round(totalHours * 10) / 10}h</p>
              </div>
              <Calendar className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Hours Chart */}
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Daily Hours (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}h`, "Hours"]} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Time by Project</CardTitle>
          </CardHeader>
          <CardContent>
            {projectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, hours }) => `${name}: ${hours}h`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="hours"
                  >
                    {projectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}h`, "Hours"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No time entries to display</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Breakdown Table */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Project Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {projectData.length > 0 ? (
            <div className="space-y-4">
              {projectData.map((project, index) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }}></div>
                    <span className="font-medium text-gray-900">{project.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{project.hours}h</p>
                    <p className="text-sm text-gray-500">{Math.round((project.hours / totalHours) * 100)}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No project data</h3>
              <p className="text-gray-500">Start tracking time to see project analytics</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
