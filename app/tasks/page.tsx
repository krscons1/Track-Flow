import { Suspense } from "react"
import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import TasksContent from "@/components/tasks/tasks-content"
import TasksSkeleton from "@/components/tasks/tasks-skeleton"

export default async function TasksPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Suspense fallback={<TasksSkeleton />}>
        <TasksContent user={user} />
      </Suspense>
    </div>
  )
}
