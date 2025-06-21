import { getCurrentUser } from "@/lib/server-only/auth"
import { redirect } from "next/navigation"
import { TaskModel } from "@/lib/server-only/models/Task"
import { ProjectModel } from "@/lib/server-only/models/Project"
import SubtaskManagementContent from "@/components/tasks/subtask-management-content"

interface SubtaskPageProps {
  params: {
    projectId: string
    taskId: string
  }
}

export default async function SubtaskManagementPage({ params }: SubtaskPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  try {
    const task = await TaskModel.findById(params.taskId)
    const project = await ProjectModel.findById(params.projectId)

    if (!task || !project) {
      redirect("/tasks")
    }

    return <SubtaskManagementContent user={user} task={task} project={project} />
  } catch (error) {
    console.error("Error loading task:", error)
    redirect("/tasks")
  }
}
