"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle, FolderOpen, Edit, Plus, Timer, Coffee, Trash } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: Date
  entityId?: string
  entityName?: string
  userName?: string
}

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
}

interface ActivityFeedProps {
  user: User
  pomodoroSessions?: any[]
}

export default function ActivityFeed({ user, pomodoroSessions = [] }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user's teamId
    const fetchTeamId = async () => {
      const res = await fetch("/api/my-teams")
      const data = await res.json()
      if (data.teams && data.teams.length > 0) {
        setTeamId(data.teams[0]._id)
      }
    }
    fetchTeamId()
  }, [])

  useEffect(() => {
    if (!teamId) return
    let interval: NodeJS.Timeout
    const fetchActivities = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/activity-logs?teamId=${teamId}`)
        const data = await res.json()
        setActivities(
          (data.activities || []).map((a: any) => ({
            id: a._id,
            type: a.type,
            description: a.description,
            timestamp: new Date(a.createdAt),
            entityId: a.entityId,
            entityName: a.entityName,
            userName: a.userName,
          }))
        )
      } catch (e) {
        setActivities([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivities()
    interval = setInterval(fetchActivities, 10000)
    return () => clearInterval(interval)
  }, [teamId])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <Plus className="h-4 w-4 text-blue-500" />
      case "task_completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "subtask_created":
        return <Plus className="h-4 w-4 text-blue-400" />
      case "subtask_completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "project_created":
        return <FolderOpen className="h-4 w-4 text-purple-500" />
      case "project_deleted":
        return <Trash className="h-4 w-4 text-red-500" />
      case "task_deleted":
        return <Trash className="h-4 w-4 text-red-400" />
      case "timelog_created":
        return <Timer className="h-4 w-4 text-blue-600" />
      case "project_updated":
        return <Edit className="h-4 w-4 text-orange-500" />
      case "pomodoro":
        return <Timer className="h-4 w-4 text-red-500" />
      case "break":
        return <Coffee className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  if (isLoading) {
    return (
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {activity.userName && (
                      <span className="font-medium text-blue-700">{activity.userName}</span>
                    )}
                    {activity.userName ? ': ' : ''}{activity.description}
                  </p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
