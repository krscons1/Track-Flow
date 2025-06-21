import { Suspense } from "react"
import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import TimeTrackingContent from "@/components/time-tracking/time-tracking-content"
import TimeTrackingSkeleton from "@/components/time-tracking/time-tracking-skeleton"

export default async function TimeTrackingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Suspense fallback={<TimeTrackingSkeleton />}>
        <TimeTrackingContent user={user} />
      </Suspense>
    </div>
  )
}
