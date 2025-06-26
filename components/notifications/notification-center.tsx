"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, Clock, MessageSquare, UserPlus, CheckCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { IoMdNotifications } from "react-icons/io"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "member"
}

interface Notification {
  _id: string
  type: "task_assigned" | "deadline_reminder" | "team_invitation" | "comment_mention" | "time_approval" | "join_request" | "join_request_response"
  title: string
  message: string
  data: any
  read: boolean
  createdAt: string
}

interface NotificationCenterProps {
  user: User
}

export default function NotificationCenter({ user }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const { toast } = useToast()
  const [processingJoinRequest, setProcessingJoinRequest] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications")
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load notifications")
      setNotifications(data.notifications)
      setUnreadCount(data.notifications.filter((n: any) => !n.read).length)
    } catch (error) {
      console.error("Failed to load notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRequestResponse = async (joinRequestId: string, status: "accepted" | "declined", notificationId?: string) => {
    setProcessingJoinRequest(joinRequestId + status)
    try {
      const response = await fetch(`/api/teams/join-requests/${joinRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        toast({
          title: `Request ${status}`,
          description: `You have ${status} the join request.`,
        })
        if (notificationId) {
          setNotifications((prev) => prev.map((n) =>
            n._id === notificationId
              ? { ...n, read: true, data: { ...n.data, joinRequestStatus: status } }
              : n
          ))
          setUnreadCount((prev) => Math.max(0, prev - 1))
        } else {
          loadNotifications()
        }
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to respond to join request")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to join request",
        variant: "destructive",
      })
    } finally {
      setProcessingJoinRequest(null)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        const response = await fetch(`/api/notifications/${notification._id}/read`, {
          method: "PATCH",
        })
        if (response.ok) {
          setNotifications((prev) => prev.map((n) => n._id === notification._id ? { ...n, read: true } : n))
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        })
      }
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
        toast({ title: "Marked all as read" })
      } else {
        throw new Error("Failed to mark all as read")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const notification = notifications.find((n) => n._id === notificationId)
        setNotifications(notifications.filter((n) => n._id !== notificationId))
        if (notification && !notification.read) {
          setUnreadCount(Math.max(0, unreadCount - 1))
        }
        toast({ title: "Deleted", description: "Notification deleted." })
      } else {
        throw new Error("Failed to delete notification")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const deleteAllNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", { method: "DELETE" })
      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
        toast({ title: "Deleted", description: "All notifications deleted." })
      } else {
        throw new Error("Failed to delete all notifications")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete all notifications",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case "deadline_reminder":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "comment_mention":
        return <MessageSquare className="h-5 w-5 text-green-600" />
      case "team_invitation":
        return <UserPlus className="h-5 w-5 text-purple-600" />
      case "time_approval":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "join_request":
        return <UserPlus className="h-5 w-5 text-purple-600" />
      case "join_request_response":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const filteredNotifications = filter === "unread" ? notifications.filter((n) => !n.read) : notifications

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold flex items-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent gap-4">
            <IoMdNotifications className="text-blue-600" size={48} />
            Notifications
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Stay updated with your team and projects</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && <Badge className="bg-red-100 text-red-800">{unreadCount} unread</Badge>}
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="destructive" onClick={deleteAllNotifications} disabled={notifications.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4 animate-fade-in">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
          className={filter === "unread" ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card className="hover-lift shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === "unread" ? "No unread notifications" : "No notifications"}
              </h3>
              <p className="text-gray-500">
                {filter === "unread" ? "You're all caught up!" : "You'll see notifications here when you have updates"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 transition-colors animate-fade-in ${
                    !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.type === "join_request_response" ? "Team Join Request" : notification.title || "Notification"}
                          </h4>
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                        <span className="text-xs text-gray-400 mt-2 block">{getTimeAgo(notification.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {notification.type === "join_request" && !notification.read && !notification.data.joinRequestStatus && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={(e) => { e.stopPropagation(); handleJoinRequestResponse(notification.data.joinRequestId, "accepted", notification._id) }}
                            disabled={!!processingJoinRequest}
                          >
                            <Check className="h-4 w-4 mr-1" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); handleJoinRequestResponse(notification.data.joinRequestId, "declined", notification._id) }}
                            disabled={!!processingJoinRequest}
                          >
                            <X className="h-4 w-4 mr-1" /> Decline
                          </Button>
                        </div>
                      )}
                      {notification.type === "join_request" && notification.data.joinRequestStatus === "accepted" && (
                        <span className="ml-4"><Badge className="bg-green-100 text-green-800">Accepted</Badge></span>
                      )}
                      {notification.type === "join_request" && notification.data.joinRequestStatus === "declined" && (
                        <span className="ml-4"><Badge className="bg-red-100 text-red-800">Declined</Badge></span>
                      )}
                      {!notification.read && notification.type !== "join_request" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
