import { type NextRequest, NextResponse } from "next/server"
import { ProjectModel } from "@/lib/server-only/models/Project"
import { getCurrentUser } from "@/lib/server-only/auth"
import { TaskModel } from "@/lib/server-only/models/Task"
import { TimeLogModel } from "@/lib/server-only/models/TimeLog"
import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"
import { ActivityLogModel } from "@/lib/server-only/models/ActivityLog"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const project = await ProjectModel.findById(params.id)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const sanitizedProject = {
      ...project,
      _id: project._id?.toString(),
      owner: project.owner.toString(),
      members: project.members.map((id) => id.toString()),
    }

    return NextResponse.json({ project: sanitizedProject })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const project = await ProjectModel.updateById(params.id, data)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const sanitizedProject = {
      ...project,
      _id: project._id?.toString(),
      owner: project.owner.toString(),
      members: project.members.map((id) => id.toString()),
    }

    return NextResponse.json({ project: sanitizedProject })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find all tasks for this project
    const tasks = await TaskModel.findByProject(params.id)
    const taskIds = tasks.map((t) => t._id?.toString()).filter(Boolean)

    // Delete all time logs for these tasks
    if (taskIds.length > 0) {
      const db = await getDatabase()
      await db.collection("timelogs").deleteMany({ taskId: { $in: taskIds.map((id) => new ObjectId(id)) } })
      // Delete all tasks for this project
      await db.collection("tasks").deleteMany({ _id: { $in: taskIds.map((id) => new ObjectId(id)) } })
    }

    // Delete the project itself
    const success = await ProjectModel.deleteById(params.id)

    if (!success) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Log activity for project deletion
    const db = await getDatabase()
    const membership = await db.collection("teamMembers").findOne({ userId: user._id })
    if (membership) {
      await ActivityLogModel.create({
        teamId: membership.workspaceId,
        userId: user._id,
        userName: user.name,
        type: "project_deleted",
        description: `Deleted project with ID ${params.id}`,
        entityId: params.id,
      })
    }

    return NextResponse.json({ message: "Project and related entries deleted successfully" })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
