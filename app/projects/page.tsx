import { Suspense } from "react"
import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import ProjectsContent from "@/components/projects/projects-content"
import ProjectsSkeleton from "@/components/projects/projects-skeleton"

export default async function ProjectsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent user={user} />
    </Suspense>
  )
}
