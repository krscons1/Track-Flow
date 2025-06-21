import { Suspense } from "react"
import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import TeamManagementContent from "@/components/team/team-management-content"
import { Card, CardContent } from "@/components/ui/card"

export default async function TeamPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Suspense fallback={<TeamSkeleton />}>
        <TeamManagementContent user={user} projectId="default" />
      </Suspense>
    </div>
  )
}

function TeamSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
