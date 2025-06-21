import { Suspense } from "react"
import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import ReportsContent from "@/components/reports/reports-content"
import ReportsSkeleton from "@/components/reports/reports-skeleton"

export default async function ReportsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Suspense fallback={<ReportsSkeleton />}>
        <ReportsContent user={user} />
      </Suspense>
    </div>
  )
}
