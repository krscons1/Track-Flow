import { Suspense } from "react"
import { getCurrentUser, getServerSession } from "@/lib/server-only/auth"
import { UserModel } from "@/lib/server-only/models/User"
import { redirect } from "next/navigation"
import TeamManagementContent from "@/components/team/team-management-content"
import { Card, CardContent } from "@/components/ui/card"

export default async function TeamPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Fetch complete user data with all required properties
  const user = await UserModel.findById(session._id)

  if (!user) {
    redirect("/auth/login")
  }

  // Sanitize user object to match expected type
  const sanitizedUser = {
    ...user,
    _id: user._id?.toString() || "",
    lastActive: user.lastActive instanceof Date ? user.lastActive.toISOString() : user.lastActive,
    projects: Array.isArray(user.projects) ? user.projects.map((p: any) => p?.toString?.() || p) : [],
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Suspense fallback={<TeamSkeleton />}>
        <TeamManagementContent user={sanitizedUser} projectId="default" />
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
