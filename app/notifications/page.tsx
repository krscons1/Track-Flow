import { Suspense } from "react"
import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import NotificationCenter from "@/components/notifications/notification-center"

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Suspense fallback={<NotificationSkeleton />}>
        <NotificationCenter user={user} />
      </Suspense>
    </div>
  )
}

function NotificationSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
