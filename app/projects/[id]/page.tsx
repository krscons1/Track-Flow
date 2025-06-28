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

    // Sanitize project object to ensure _id and ObjectId fields are strings
    const projectWithStringId = project && {
      ...project,
      _id: project._id?.toString() || "",
      owner: (project.owner as any)?.toString?.() || (typeof project.owner === "string" ? project.owner : ""),
      members: Array.isArray(project.members) ? project.members.map((m: any) => m?.toString?.() || m) : [],
      startDate: project.startDate instanceof Date ? project.startDate.toISOString() : project.startDate,
      dueDate: project.dueDate instanceof Date ? project.dueDate.toISOString() : project.dueDate,
      createdAt: project.createdAt instanceof Date ? project.createdAt.toISOString() : project.createdAt,
      updatedAt: project.updatedAt instanceof Date ? project.updatedAt.toISOString() : project.updatedAt,
    }

    const tasksRaw = await TaskModel.findByProject(params.id)
    const tasks = tasksRaw.map((task) => ({
      ...task,
      _id: task._id?.toString() || "",
      project: (task.project as any)?.toString?.() || (typeof task.project === "string" ? task.project : ""),
      assignee: (task.assignee as any)?.toString?.() || (typeof task.assignee === "string" ? task.assignee : ""),
      createdBy: (task.createdBy as any)?.toString?.() || (typeof task.createdBy === "string" ? task.createdBy : ""),
      dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate,
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
      updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
    }))
    const usersRaw = await UserModel.findAll()
    const users = usersRaw.map((u) => ({
      ...u,
      _id: u._id?.toString() || "",
      projects: Array.isArray(u.projects) ? u.projects.map((p: any) => p?.toString?.() || p) : [],
      lastActive: u.lastActive instanceof Date ? u.lastActive.toISOString() : u.lastActive,
      lastLogin: u.lastLogin instanceof Date ? u.lastLogin.toISOString() : u.lastLogin,
      lastLogout: u.lastLogout instanceof Date ? u.lastLogout.toISOString() : u.lastLogout,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
      updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : u.updatedAt,
    }))

    return <ProjectDetailContent user={user} project={projectWithStringId} tasks={tasks} users={users} />
  } catch (error) {
    console.error("Error loading project:", error)
    redirect("/projects")
  }
}
