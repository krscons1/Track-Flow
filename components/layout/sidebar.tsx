"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  TrendingUp,
  LogOut,
  Users,
  Clock,
  Bell,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    name: "Time Tracking",
    href: "/dashboard/time-tracking",
    icon: Clock,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    badge: 3, // Mock unread count
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Only fetch unread notifications count on initial render
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch("/api/notifications?unreadOnly=1")
        const data = await res.json()
        if (res.ok && Array.isArray(data.notifications)) {
          setUnreadCount(data.notifications.length)
        }
      } catch {}
    }
    fetchUnreadCount()
  }, [])

  // Hide sidebar on auth pages
  const authPages = ["/auth/login", "/auth/register", "/login", "/signup", "/forgot-password"]
  const isAuthPage = authPages.some((page) => pathname.startsWith(page))

  if (isAuthPage) {
    return null
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={cn("flex items-center", isCollapsed && "justify-center")}>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && <span className="ml-3 text-xl font-bold text-gray-900">TrackFlow</span>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex">
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            // Only show badge for notifications, use dynamic unreadCount
            const showBadge = item.name === "Notifications" && unreadCount > 0
            const handleClick = () => {
              if (item.name === "Notifications") {
                setUnreadCount(0)
              }
              setIsMobileOpen(false)
            }
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  isCollapsed && "justify-center",
                )}
                onClick={handleClick}
              >
                <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                {!isCollapsed && (
                  <>
                    <span>{item.name}</span>
                    {showBadge && (
                      <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </>
                )}
                {isCollapsed && showBadge && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed && user && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={logout} className={cn("w-full", isCollapsed && "px-2")}>
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </div>
    </>
  )
}
