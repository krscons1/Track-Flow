"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Target } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
}

interface UserReportChartsProps {
  user: User
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]

export default function UserReportCharts({ user }: UserReportChartsProps) {
  const [projectData, setProjectData] = useState<any[]>([])
  const [taskStatusData, setTaskStatusData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChartData()
  }, [])

  const loadChartData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([fetch("/api/projects"), fetch("/api/tasks")])

      const [projectsData, tasksData] = await Promise.all([projectsRes.json(), tasksRes.json()])

      if (projectsRes.ok && tasksRes.ok) {
        const projects = projectsData.projects || []
        const tasks = tasksData.tasks || []

        // Top 2 Active Projects with completion rates
        const projectStats = projects
          .map((project: any) => {
            const projectTasks = tasks.filter((task: any) => task.project === project._id)
            const completedTasks = projectTasks.filter((task: any) => task.status === "completed")
            const completionRate = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0

            return {
              name: project.title,
              completion: Math.round(completionRate),
              totalTasks: projectTasks.length,
              completedTasks: completedTasks.length,
            }
          })
          .sort((a: any, b: any) => b.totalTasks - a.totalTasks)
          .slice(0, 2)

        setProjectData(projectStats)

        // Task status distribution
        const statusCounts = tasks.reduce((acc: any, task: any) => {
          acc[task.status] = (acc[task.status] || 0) + 1
          return acc
        }, {})

        const statusData = [
          { name: "To Do", value: statusCounts.todo || 0, color: "#6B7280" },
          { name: "In Progress", value: statusCounts["in-progress"] || 0, color: "#3B82F6" },
          { name: "Review", value: statusCounts.review || 0, color: "#F59E0B" },
          { name: "Completed", value: statusCounts.completed || 0, color: "#10B981" },
        ].filter((item) => item.value > 0)

        setTaskStatusData(statusData)
      }
    } catch (error) {
      console.error("Failed to load chart data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Top Active Projects */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Top Active Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No projects found</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: any, name: string) => [
                    `${value}%`,
                    name === "completion" ? "Completion Rate" : name,
                  ]}
                />
                <Bar dataKey="completion" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Task Status Distribution */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-gray-800">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Task Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {taskStatusData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks found</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
