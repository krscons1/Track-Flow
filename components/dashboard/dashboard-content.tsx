"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, Clock, FolderOpen, Plus, Users, ArrowRight, Target } from "lucide-react"
import Link from "next/link"
import UserReportCharts from "./user-report-charts"
import ActivityFeed from "./activity-feed"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar?: string
}

interface DashboardContentProps {
  user: User
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load projects
      const projectsResponse = await fetch("/api/projects")
      const projectsData = await projectsResponse.json()

      // Load tasks
      const tasksResponse = await fetch("/api/tasks")
      const tasksData = await tasksResponse.json()

      // Load users
      const usersResponse = await fetch("/api/users")
      const usersData = await usersResponse.json()

      // Calculate stats
      const projects = projectsData.projects || []
      const tasks = tasksData.tasks || []
      const users = usersData.users || []

      setStats({
        totalProjects: projects.length,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter((t: any) => t.status !== "completed").length,
        completedTasks: tasks.filter((t: any) => t.status === "completed").length,
        teamMembers: users.length,
      })

      setRecentProjects(projects.slice(0, 5))
      setMyTasks(tasks.filter((t: any) => t.assignee === user._id).slice(0, 5))
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
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
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-2 hover:bg-gray-50 transition-all duration-200">
            <Link href="/tasks/new">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-slide-in">
        <Card className="hover-lift bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Projects</CardTitle>
            <FolderOpen className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs opacity-80 mt-1">Active projects</p>
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Tasks</CardTitle>
            <CheckCircle className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs opacity-80 mt-1">All tasks</p>
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Pending Tasks</CardTitle>
            <Clock className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs opacity-80 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Completed</CardTitle>
            <Target className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs opacity-80 mt-1">Tasks done</p>
          </CardContent>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Team Members</CardTitle>
            <Users className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs opacity-80 mt-1">Active members</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Charts Section */}
      <UserReportCharts user={user} />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Recent Projects */}
        <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <FolderOpen className="h-5 w-5 mr-2 text-blue-600" />
              Recent Projects
            </CardTitle>
            <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 transition-colors">
              <Link href="/projects" className="flex items-center">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">No projects yet</p>
                  <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/projects/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first project
                    </Link>
                  </Button>
                </div>
              ) : (
                recentProjects.map((project: any, index) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{project.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due: {new Date(project.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      className={`ml-4 ${
                        project.status === "completed"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : project.status === "in-progress"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : project.status === "on-hold"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {project.status.replace("-", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <ActivityFeed user={user} />
      </div>
    </div>
  )
}
