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

    // Sanitize task and project objects to ensure _id and ObjectId fields are strings
    const sanitizedTask = task && {
      ...task,
      _id: task._id?.toString() || "",
      project: (task.project as any)?.toString?.() || (typeof task.project === "string" ? task.project : ""),
      dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate,
    };
    const sanitizedProject = project && {
      ...project,
      _id: project._id?.toString() || "",
      owner: (project.owner as any)?.toString?.() || (typeof project.owner === "string" ? project.owner : ""),
      members: Array.isArray(project.members) ? project.members.map((m: any) => m?.toString?.() || m) : [],
      startDate: project.startDate instanceof Date ? project.startDate.toISOString() : project.startDate,
      dueDate: project.dueDate instanceof Date ? project.dueDate.toISOString() : project.dueDate,
    };
    return <SubtaskManagementContent user={user} task={sanitizedTask} project={sanitizedProject} />
  } catch (error) {
    console.error("Error loading task:", error)
    redirect("/tasks")
  }
}
