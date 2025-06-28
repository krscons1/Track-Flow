import { type NextRequest, NextResponse } from "next/server"
import { TaskModel } from "@/lib/server-only/models/Task"
import { getCurrentUser } from "@/lib/server-only/auth"
import { ActivityLogModel } from "@/lib/server-only/models/ActivityLog"
import { getDatabase } from "@/lib/server-only/mongodb"
import { ObjectId } from "mongodb"

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

    const task = await TaskModel.findById(params.id)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const sanitizedTask = {
      ...task,
      _id: task._id?.toString(),
      project: task.project.toString(),
      assignee: task.assignee.toString(),
      createdBy: task.createdBy.toString(),
    }

    return NextResponse.json({ task: sanitizedTask })
  } catch (error) {
    console.error("Get task error:", error)
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
    const task = await TaskModel.updateById(params.id, data)

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Log activity if task is completed
    if (data.status === "completed") {
      const db = await getDatabase()
      const membership = await db.collection("teamMembers").findOne({ userId: user._id })
      if (membership) {
        await ActivityLogModel.create({
          teamId: membership.workspaceId,
          userId: new ObjectId(user._id),
          userName: user.name,
          type: "task_completed",
          description: `Completed task \"${task.title}\"`,
          entityId: task._id,
          entityName: task.title,
        })
      }
    }

    const sanitizedTask = {
      ...task,
      _id: task._id?.toString(),
      project: task.project.toString(),
      assignee: task.assignee.toString(),
      createdBy: task.createdBy.toString(),
    }

    return NextResponse.json({ task: sanitizedTask })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const success = await TaskModel.deleteById(params.id)

    if (!success) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const db = await getDatabase()
    const membership = await db.collection("teamMembers").findOne({ userId: user._id })
    if (membership) {
      await ActivityLogModel.create({
        teamId: membership.workspaceId,
        userId: new ObjectId(user._id),
        userName: user.name,
        type: "task_deleted",
        description: `Deleted task with ID ${params.id}`,
        entityId: new ObjectId(params.id),
      })
    }

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
