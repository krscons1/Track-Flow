import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import { ProjectModel } from "@/lib/server-only/models/Project"
import { TaskModel } from "@/lib/server-only/models/Task"
import { UserModel } from "@/lib/server-only/models/User"
import ProjectDetailContent from "@/components/projects/project-detail-content"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  try {
    const project = await ProjectModel.findById(params.id)

    if (!project) {
      redirect("/projects")
    }

    const projectWithStringId = { ...project, _id: project._id?.toString?.() || project._id }

    const tasks = await TaskModel.findByProject(params.id)
    const users = await UserModel.findAll()

    return <ProjectDetailContent user={user} project={projectWithStringId} tasks={tasks} users={users} />
  } catch (error) {
    console.error("Error loading project:", error)
    redirect("/projects")
  }
}
